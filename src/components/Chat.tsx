import {useEffect, useMemo, useRef, useState} from "react";
import {getToken, setRefreshToken, setToken} from "../lib/auth";
import {useLocation, useNavigate} from "react-router-dom";
import {refreshToken} from "../lib/refreshToken";
import {
    getConversationData,
    getUserThreads,
    type UserConversationThreadsResponse
} from "../lib/conversationMessagesResponse";
import {useAppBusy} from "../context/AppBusyContext.tsx";
import Bubble from "./Bubble.tsx";

type Msg = { id: string; role: "user" | "assistant" | "assistant-thinking"; content: string };

const openingThinkTag = /<think>/;
const closingThinkTag = /<\/think>/;
export default function Chat({apiUrl, threadId, updateThreadId, setConversationThreads}: {
    apiUrl: string,
    threadId: string | null,
    updateThreadId: (id: string) => void,
    setConversationThreads?: (value: (((prevState: (UserConversationThreadsResponse | null)) => (UserConversationThreadsResponse | null)) | UserConversationThreadsResponse | null)) => void,
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");

    const viewportRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        viewportRef.current?.scrollTo({top: viewportRef.current.scrollHeight, behavior: "smooth"});
    };

    const {setBusy} = useAppBusy();
    const {isBusy} = useAppBusy();

    const canSend = useMemo(() => input.trim().length > 0 && !isBusy, [input, isBusy]);

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
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!threadId) {
            setMessages([]);
            setInput("");
        }
    }, [threadId]);

    async function sendMsg(text: string) {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${getToken() || ""}`,
            ...(threadId ? {"X-Thread-Id": threadId} : {}), // only if present
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

    function goToLogin() {
        setRefreshToken("");
        setToken("")
        navigate("/login", {replace: true, state: {from: location}});
        return;
    }

    async function tryAgain(response: Response, text: string) {
        const refreshResult = await refreshToken();
        if (refreshResult.ok) {
            response = await sendMsg(text);
        } else {
            goToLogin();
        }
        return response;
    }

    function addChunkToCorrectMsg(msgId: string, chunk: string) {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === msgId ? { ...msg, content: msg.content + chunk } : msg
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

        const userId = crypto.randomUUID();
        const asstId = crypto.randomUUID();
        const asstThinkingId = crypto.randomUUID();
        setMessages((m) => {
            const userMsg = {id: userId, role: "user" as const, content: text};
            const asstMsg = {id: asstId, role: "assistant" as const, content: ""};
            const asstThinkingMsg = {id: asstThinkingId, role: "assistant-thinking" as const, content: ""};
            return [...m, userMsg, asstMsg, asstThinkingMsg];
        });

        try {
            setBusy(true);
            let response = await sendMsg(text);
            updateConversationThreadIdFromApi(response);
            if (response.status !== 200) {
                response = await tryAgain(response, text);
            }

            if (!response.ok || !response.body) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let bufferRef = "";
            let isAiThinking = false;
            while (true) {
                const {value, done} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, {stream: true});
                bufferRef += chunk;
                console.log(bufferRef);
                // if the chunk starts a <think> block — show the "thinking" bubble right away
                if(bufferRef.match(openingThinkTag)) {
                    isAiThinking = true;
                    bufferRef = "";
                } else if (bufferRef.match(closingThinkTag)) {
                    isAiThinking = false;
                    bufferRef = "";
                }

                if (isAiThinking) {
                    addChunkToCorrectMsg(asstThinkingId, chunk);
                } else {  // update assistant visible text
                    addChunkToCorrectMsg(asstId, chunk);
                }

            }
            if (!threadId) {
                // refresh the sidebar list after the first message created a new thread
                const res = await getUserThreads();
                if (!res.ok && res.error === "Unauthenticated") {
                    navigate("/login", {replace: true});
                    return;
                }
                setConversationThreads?.(res);
            }

        } catch (e) {
            handleErrorForInvokingChatBotApi(asstId);
            console.error(e);
        } finally {
            setBusy(false);
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
        <div
            className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
            <div ref={viewportRef}
                 className="flex-1 min-h-[50svh] sm:min-h-0 overflow-y-auto px-2 sm:px-4 py-4 space-y-2 sm:space-y-4">
                {messages.map((m) => (
                    <Bubble key={m.id} role={m.role} content={m.content} />
                ))}
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