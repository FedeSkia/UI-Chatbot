import {useEffect, useState} from "react";
import Chat from "../components/Chat";
import {useNavigate} from "react-router-dom";
import {
    getUserThreads,
    type UserConversationThread,
    type UserConversationThreadsResponse
} from "../lib/conversationMessagesResponse.ts";
import Sidebar from "../components/Sidebar.tsx";
import TopBar from "../components/TopBar.tsx";

const API_URL = import.meta.env.VITE_API_URL as string;


export function ChatPage() {
    const [conversationThreads, setConversationThreads] = useState<UserConversationThreadsResponse | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const navigate = useNavigate();
    const [isChatBotResponding, setIsChatBotResponding] = useState(false);
    const [sidebarOpen, setIssidebarOpen] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await getUserThreads();
            if (!res.ok && res.error === "Unauthenticated") {
                navigate("/login", {replace: true});
                return;
            }
            setConversationThreads(res);
            if (res.threads && res.threads.length > 0) {
                setActiveThreadId((prev) => prev ?? res.threads[0].thread_id)
            }
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

    return (
        <div className="mx-auto max-w-7xl px-4 py-4">
            <TopBar
                setIsSidebarOpen={setIssidebarOpen}
                isSideBarOpen={sidebarOpen}/>
            <div className="flex gap-4">
                <Sidebar
                    conversationThreads={conversationThreads}
                    activeThreadId={activeThreadId}
                    onSelect={handleSelect}
                    onNew={handleNew}
                    isChatBotResponding={isChatBotResponding}
                    sidebarOpen={sidebarOpen}
                />

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