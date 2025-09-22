import {useEffect, useState} from "react";
import Chat from "../components/Chat";
import {useNavigate} from "react-router-dom";
import {getUserThreads, type UserConversationThreadsResponse} from "../lib/conversationMessagesResponse.ts";
import Sidebar from "../components/Sidebar.tsx";

const API_URL = import.meta.env.VITE_API_URL as string;


export default function ChatPage() {
    const [conversationThreads, setConversationThreads] = useState<UserConversationThreadsResponse | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const navigate = useNavigate();
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

    function handleNew() {
        setActiveThreadId(null);
    }

    function handleSelect(threadId: string) {
        setActiveThreadId(threadId);
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex gap-4">
                <Sidebar
                    conversationThreads={conversationThreads}
                    activeThreadId={activeThreadId}
                    onSelect={handleSelect}
                    onNew={handleNew}
                />

                <main className="min-w-0 flex-1">
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