import {useEffect, useState} from "react";
import Chat from "../components/Chat";
import {useNavigate} from "react-router-dom";
import {deleteThread, getUserThreads, type UserConversationThread} from "../lib/conversationMessagesResponse.ts";
import Sidebar from "../components/Sidebar.tsx";
import MobileSidebar from "../components/MobileSidebar.tsx";

const API_URL = import.meta.env.VITE_API_URL as string;

export function ChatPage({isMobileSidebarOpen, setIsMobileSidebarOpen}: {
    isMobileSidebarOpen: boolean,
    setIsMobileSidebarOpen: any
}) {
    const [conversationThreads, setConversationThreads] = useState<UserConversationThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null | undefined>(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('ChatPage mounted');
        return () => console.log('ChatPage unmounted');
    }, []);

    useEffect(() => {
        getUserThreads().then(res => {
            if (!res.ok && res.error === "Unauthenticated") {
                navigate("/login", {replace: true});
                return;
            }
            if (res && res.threads && res.threads.length > 0) {
                setConversationThreads(res.threads);
                setActiveThreadId(res.threads[0].thread_id);
            } else {
                setActiveThreadId(null);
            }
        })
    }, [navigate]);

    function addDummyThreadToConversations(tempId: string, now: string, prev: UserConversationThread[]): UserConversationThread[] {
        const newThread: UserConversationThread = {
            thread_id: tempId,
            created_at: now,
            updated_at: now,
            has_msg: false,
        };

        if (!prev) {
            return [newThread]
        }
        return prev.concat(newThread);
    }

    function handleNew() {
        //Do nothing if empty conversation already exists
        if (conversationThreads && conversationThreads.length > 0) {
            const foundEmptyConversation = conversationThreads.find(value => value.thread_id === "tmp");
            if (foundEmptyConversation !== undefined) {
                return
            }
        }

        const now = new Date().toISOString();
        const tempId = "tmp"; // placeholder id for UI only
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
            return getUserThreads().then(res => {
                if (!res.ok && res.error === "Unauthenticated") {
                    navigate("/login", {replace: true});
                    return;
                }
                if (res) {
                    setConversationThreads(res.threads);
                    if (res.threads.length > 0) {
                        setActiveThreadId(res.threads[0].thread_id);
                    } else {
                        setActiveThreadId(null);
                    }
                } else {
                    setActiveThreadId(null);
                }
            })

        }
    }


    return (
        <div className="w-full px-2 sm:px-4 py-3 flex flex-col flex-1 min-h-0 overflow-hidden">
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
                            onDelete={deleteConversationThread}
                        />
                    )}
                </div>
                <main className="min-w-0 flex-1 flex min-h-0">
                    <Chat
                        apiUrl={API_URL}
                        threadId={activeThreadId}
                        updateCurrentThreadId={handleSelect}
                        setConversationThreads={setConversationThreads}
                    />
                </main>
            </div>
        </div>
    );
}