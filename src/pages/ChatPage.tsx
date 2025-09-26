import {useEffect, useState} from "react";
import Chat from "../components/Chat";
import {useNavigate, useOutletContext} from "react-router-dom";
import {
    deleteThread,
    getUserThreads,
    type UserConversationThread,
    type UserConversationThreadsResponse
} from "../lib/conversationMessagesResponse.ts";
import Sidebar from "../components/Sidebar.tsx";
import MobileSidebar from "../components/MobileSidebar.tsx";
import DeleteDocumentModal from "../components/DeleteDocumentModal.tsx";
import {deleteUserDocument} from "../lib/documents.ts";

const API_URL = import.meta.env.VITE_API_URL as string;

type LayoutCtx = {
    isMobileSidebarOpen: boolean;
    setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ChatPage() {
    const [conversationThreads, setConversationThreads] = useState<UserConversationThreadsResponse | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const navigate = useNavigate();
    const [isChatBotResponding, setIsChatBotResponding] = useState(false);
    const {isMobileSidebarOpen, setIsMobileSidebarOpen} =
        useOutletContext<LayoutCtx>();

    async function retrieveAndSetConversations() {
        const res = await getUserThreads();
        if (!res.ok && res.error === "Unauthenticated") {
            navigate("/login", {replace: true});
            return;
        }
        setConversationThreads(res);
        if (res.threads && res.threads.length > 0) {
            setActiveThreadId((prev) => prev ?? res.threads[0].thread_id)
        } else {
            setActiveThreadId(null);
        }
    }

    useEffect(() => {
        (async () => {
            await retrieveAndSetConversations();
        })();
    }, [navigate]);

    function addDummyThreadToConversations(tempId: string, now: string, prev: UserConversationThreadsResponse | null) {
        const newThread: UserConversationThread = {
            thread_id: tempId,
            created_at: now,
            updated_at: now,
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
        setActiveThreadId(null);

        const now = new Date().toISOString();
        const tempId = `tmp-${crypto.randomUUID()}`; // placeholder id for UI only

        setConversationThreads(prev => {
            return addDummyThreadToConversations(tempId, now, prev);
        });
        setActiveThreadId(tempId)
    }

    function handleSelect(threadId: string) {
        setActiveThreadId(threadId);
    }

    async function deleteConversationThread(threadId: string) {
        const resp = await deleteThread(threadId);
        if (resp.ok) {
            await retrieveAndSetConversations();
        }
    }


    return (
        <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex gap-4">
                {/* Desktop sidebar */}
                <div className="hidden md:block">
                    <Sidebar
                        conversationThreads={conversationThreads}
                        activeThreadId={activeThreadId}
                        onSelect={handleSelect}
                        onNew={handleNew}
                        isChatBotResponding={isChatBotResponding}
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
                            isChatBotResponding={isChatBotResponding}
                            onDelete={async (id) => {
                                // call your backend delete and then update local threads
                                await deleteConversationThread(id);
                                setConversationThreads((prev) =>
                                    prev ? { ...prev, threads: prev.threads.filter(t => t.thread_id !== id) } : prev
                                );
                                if (activeThreadId === id) setActiveThreadId(null);
                            }}
                        />
                    )}
                </div>
                <main className="min-w-0 flex-1">
                    <Chat
                        apiUrl={API_URL}
                        threadId={activeThreadId}
                        updateThreadId={handleSelect}
                        setConversationThreads={setConversationThreads}
                        setIsChatBotResponding={setIsChatBotResponding}
                    />
                </main>
            </div>
        </div>
    );
}