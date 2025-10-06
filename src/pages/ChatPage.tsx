import {useCallback, useEffect, useState} from "react";
import Chat from "../components/Chat";
import {useNavigate} from "react-router-dom";
import {
    deleteThread,
    getUserThreads,
    type UserConversationThread,
    type UserConversationThreadsResponse
} from "../lib/conversationMessagesResponse.ts";
import Sidebar from "../components/Sidebar.tsx";
import MobileSidebar from "../components/MobileSidebar.tsx";

const API_URL = import.meta.env.VITE_API_URL as string;

export function ChatPage({isMobileSidebarOpen, setIsMobileSidebarOpen}: {
    isMobileSidebarOpen: boolean,
    setIsMobileSidebarOpen: any
}) {
    const [conversationThreads, setConversationThreads] = useState<UserConversationThreadsResponse | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null | undefined>(null);
    const navigate = useNavigate();

    const retrieveAndSetConversations = useCallback(async (): Promise<UserConversationThreadsResponse | undefined> => {
        const res = await getUserThreads();
        if (!res.ok && res.error === "Unauthenticated") {
            navigate("/login", {replace: true});
            return;
        }
        return res;
    }, [navigate]);

    useEffect(() => {
        console.log('ChatPage mounted');
        return () => console.log('ChatPage unmounted');
    }, []);

    useEffect(() => {
        (async () => {
            const response = await retrieveAndSetConversations();
            if(response) {
                setConversationThreads(response);
                if (response.threads && response.threads.length > 0) {
                    const newActiveThreadId = response.threads.find(value => value.has_msg)?.thread_id;
                    setActiveThreadId(newActiveThreadId);
                } else {
                    setActiveThreadId(null);
                }
            }
        })();
    }, [retrieveAndSetConversations]);

    function addDummyThreadToConversations(tempId: string, now: string, prev: UserConversationThreadsResponse | null) {
        const newThread: UserConversationThread = {
            thread_id: tempId,
            created_at: now,
            updated_at: now,
            has_msg: false,
        };

        if (!prev) {
            return {
                ok: true,
                error: "",
                threads: [newThread],
            };
        }

        return {
            ...prev,
            threads: [newThread, ...prev.threads],
        };
    }

    function handleNew() {
        //Do nothing if empty conversation already exists
        if(conversationThreads && conversationThreads.threads && conversationThreads.threads.length > 0) {
            const foundEmptyConversation = conversationThreads?.threads.find(value => value.has_msg);
            if(foundEmptyConversation === undefined) {
                return
            }
        }

        const now = new Date().toISOString();
        const tempId = `tmp-${crypto.randomUUID()}`; // placeholder id for UI only
        setActiveThreadId(tempId);
        setConversationThreads(prev => {
            return addDummyThreadToConversations(tempId, now, prev);
        });
    }

    function handleSelect(threadId: string) {
        setActiveThreadId(threadId);
    }

    async function deleteConversationThread(threadId: string) {
        const resp = await deleteThread(threadId);
        if (resp.ok) {
            const conversations = await retrieveAndSetConversations();
            if(conversations) {
                setConversationThreads(conversations);
            }
        }
    }


    return (
        <div className="w-full px-2 sm:px-4 py-3 flex-1 overflow-hidden">
            <div className="flex gap-4 h-full min-h-0">
                {/* Desktop sidebar */}
                <div className="hidden md:block">
                    <Sidebar
                        conversationThreads={conversationThreads}
                        activeThreadId={activeThreadId}
                        onSelect={handleSelect}
                        onNew={handleNew}
                        onDelete={deleteConversationThread}
                    />
                </div>
                {/* Mobile drawer */}
                <div className="md:hidden">
                    {isMobileSidebarOpen && (
                        <MobileSidebar
                            isMobileSideBarOpen={isMobileSidebarOpen}
                            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                            conversationThreads={conversationThreads}
                            activeThreadId={activeThreadId}
                            onSelect={handleSelect}
                            onNew={handleNew}
                            onDelete={async (id) => {
                                await deleteConversationThread(id);
                                setConversationThreads((prev) =>
                                    prev ? { ...prev, threads: prev.threads.filter(t => t.thread_id !== id) } : prev
                                );
                                if (activeThreadId === id) setActiveThreadId(null);
                            }}
                        />
                    )}
                </div>
                <main className="min-w-0 flex-1 flex min-h-0">
                    <Chat
                        apiUrl={API_URL}
                        threadId={activeThreadId}
                        updateThreadId={handleSelect}
                        setConversationThreads={setConversationThreads}
                    />
                </main>
            </div>
        </div>
    );
}