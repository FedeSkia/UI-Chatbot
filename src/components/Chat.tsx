import {useEffect, useMemo, useRef, useState} from "react";
import {getToken, setRefreshToken, setToken} from "../lib/auth";
import {useLocation, useNavigate} from "react-router-dom";
import {refreshToken} from "../lib/refreshToken";
import {
    getConversationData,
    getUserThreads,
    type UserConversationThreadsResponse
} from "../lib/conversationMessagesResponse";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export default function Chat({apiUrl, threadId, updateThreadId, setConversationThreads, setIsChatBotResponding}: {
    apiUrl: string,
    threadId: string | null,
    updateThreadId: (id: string) => void,
    setConversationThreads?: (value: (((prevState: (UserConversationThreadsResponse | null)) => (UserConversationThreadsResponse | null)) | UserConversationThreadsResponse | null)) => void,
    setIsChatBotResponding: (value: boolean) => void,
}) {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!getToken()) {
            navigate("/login", {replace: true, state: {from: location}});
        }
    }, [location, navigate]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!threadId) return;
            const res = await getConversationData(threadId);
            if (cancelled) return;
            if (!res.ok) {
                if (res.error === "Unauthenticated") {
                    navigate("/login", {replace: true, state: {from: location}});
                    return;
                }
                // otherwise keep empty / show a system bubble
                setMessages([{id: crypto.randomUUID(), role: "assistant", content: "Nessuna conversazione trovata."}]);
                return;
            }
            const mapped: Msg[] = res.messages.map((m) => ({
                id: crypto.randomUUID(),
                role: m.type === "human" ? "user" : "assistant",
                content: m.content ?? ""
            }));
            setMessages(mapped);
        })();

        return () => {
            cancelled = true;
        };

    }, [threadId, navigate, location]);

    useEffect(() => {
        if (!threadId) {
            setMessages([]);
            setInput("");
        }
    }, [threadId]);

    const [messages, setMessages] = useState<Msg[]>([]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        viewportRef.current?.scrollTo({top: viewportRef.current.scrollHeight, behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

    async function sendMsg(text: string) {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${getToken() || ""}`,
            ...(threadId ? { "X-Thread-Id": threadId } : {}), // only if present
        };
        return await fetch(`${apiUrl}/api/chat/invoke`, {
            method: "POST",
            headers,
            body: JSON.stringify({content: text}),
        });
    }

    function updateConversationThreadIdFromApi(response: Response) {
        // If this is a brand-new conversation, capture the thread id from response headers right away
        if (!threadId) {
            const newThreadId = response.headers.get("X-Thread-Id");
            if (newThreadId) {
                updateThreadId(newThreadId);
            }
        }
    }

    function handleErrorForInvokingChatBotApi(asstId: `${string}-${string}-${string}-${string}-${string}`) {
        setMessages((m) =>
            m.map((msg) =>
                msg.id === asstId
                    ? {
                        ...msg,
                        content:
                            (msg.content || "") +
                            "\n\n⚠️ Errore durante lo streaming della risposta. Controlla la console.",
                    }
                    : msg
            )
        );
    }

    const handleSend = async () => {
        const text = input.trim();
        setInput("") //reset the box with the user input
        if (!text) return;

        // If somehow token disappeared since mount, redirect
        if (!getToken()) {
            navigate("/login", {replace: true, state: {from: location}});
            return;
        }

        // push user + placeholder
        const userId = crypto.randomUUID();
        const asstId = crypto.randomUUID();
        setMessages((m) => [
            ...m,
            {id: userId, role: "user", content: text},
            {id: asstId, role: "assistant", content: ""}
        ]);

        setLoading(true);
        try {
            setIsChatBotResponding(true);
            let response = await sendMsg(text);
            updateConversationThreadIdFromApi(response);
            if (response.status !== 200) {
                const refreshResult = await refreshToken();
                if (refreshResult.ok) {
                    response = await sendMsg(text);
                } else {
                    setRefreshToken("");
                    setToken("")
                    navigate("/login", {replace: true, state: {from: location}});
                    return;
                }
            }

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            while (true) {
                const {value, done} = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, {stream: true});
                setMessages((m) =>
                    m.map((msg) => (msg.id === asstId ? {...msg, content: msg.content + chunk} : msg))
                );
            }
            if (!threadId) {
                // refresh the sidebar list after the first message created a new thread
                const res = await getUserThreads();
                if (!res.ok && res.error === "Unauthenticated") {
                    navigate("/login", { replace: true });
                    return;
                }
                setConversationThreads?.(res);
            }

        } catch (e) {
            handleErrorForInvokingChatBotApi(asstId);
        } finally {
            setIsChatBotResponding(false);
            setLoading(false);
            scrollToBottom();
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey && canSend) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-md bg-green-600"/>
                    <div>
                        <div className="text-sm font-semibold">Chat AI</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Online</div>
                    </div>
                </div>
                <span className="text-xs text-gray-500">{messages.length} messages count</span>
            </div>

            {/* Messages */}
            <div ref={viewportRef} className="flex-1 min-h-0 overflow-y-auto px-2 py-4 space-y-2">
                {messages.map((m) => (
                    <Bubble key={m.id} role={m.role} content={m.content}/>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2"></span>
            </span>
                        Replying…
                    </div>
                )}
            </div>

            {/* Composer */}
            <div className="border-t border-gray-200 p-3">
                <div
                    className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white/80 px-2 py-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Ask what you want…"
                        className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor">
                            <path strokeWidth="2" d="M22 2L11 13"/>
                            <path strokeWidth="2" d="M22 2L15 22L11 13L2 9L22 2Z"/>
                        </svg>
                        Send
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Press send</p>
            </div>
        </div>
    );
}

function Bubble({role, content}: { role: "user" | "assistant"; content: string }) {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-3 max-w-[80%]`}>
                {!isUser && (
                    <div className="shrink-0 mt-1 size-6 flex items-center justify-center rounded-full bg-blue-500 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h6v6H9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l1.414 1.414M6.05 6.05L4.636 4.636" />
                        </svg>
                    </div>
                )}
                <div
                    className={[
                        "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                        isUser
                            ? "bg-gray-500 text-white rounded-br-sm"
                            : "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap bg-blue-500 text-white rounded-br-sm",
                    ].join(" ")}
                >
                    {content || <span className="opacity-0">…</span>}
                </div>
                {isUser && <div className="shrink-0 mt-1 size-6 flex items-center justify-center rounded-full bg-gray-300/80 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.72 5.879 1.928M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>}
            </div>
        </div>
    );
}