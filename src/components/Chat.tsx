import { useEffect, useMemo, useRef, useState } from "react";
import {getToken} from "../lib/auth.ts";
import {Navigate} from "react-router-dom";
import {refreshToken} from "../lib/refreshToken.ts";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export default function Chat({ apiUrl }: { apiUrl: string }) {
    const [messages, setMessages] = useState<Msg[]>([
        { id: "w1", role: "assistant", content: "Ciao! Scrivimi qualcosa e risponderò in streaming." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

    async function sendMsg(text: string) {
        const response = await fetch(`${apiUrl}/api/chat/invoke`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`,
                "accept": "application/json",
                "X-Thread-Id": "5645546"
            },
            body: JSON.stringify({content: text}),
        });
        return response;
    }

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;

        // Push user message
        const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
        setMessages((m) => [...m, userMsg]);
        setInput("");

        // Prepare assistant placeholder
        const asstId = crypto.randomUUID();
        setMessages((m) => [...m, { id: asstId, role: "assistant", content: "" }]);

        setLoading(true);
        try {
            let response = await sendMsg(text);

            if(response.status !== 200) {
                const refreshResult = await refreshToken();
                if (refreshResult.ok) {
                    response = await sendMsg(text);
                } else {
                    return <Navigate to="/login" replace state={{ from: location }} />;
                }
            }
            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages((m) =>
                    m.map((msg) => (msg.id === asstId ? { ...msg, content: msg.content + chunk } : msg))
                );
            }
        } catch (e) {
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
            // optional: console.error(e);
        } finally {
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
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-md bg-blue-600" />
                    <div>
                        <div className="text-sm font-semibold">Assistant</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Online</div>
                    </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{messages.length} messaggi</span>
            </div>

            {/* Messages */}
            <div ref={viewportRef} className="h-[480px] overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((m) => (
                    <Bubble key={m.id} role={m.role} content={m.content} />
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2"></span>
            </span>
                        Generando risposta…
                    </div>
                )}
            </div>

            {/* Composer */}
            <div className="border-t border-gray-200 dark:border-white/10 p-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2 py-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Scrivi un messaggio…"
                        className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" d="M22 2L11 13" />
                            <path strokeWidth="2" d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                        Invia
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Invia con Invio</p>
            </div>
        </div>
    );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-3 max-w-[80%]`}>
                {!isUser && (
                    <div className="shrink-0 mt-1 size-6 rounded-full bg-blue-600/90" />
                )}
                <div
                    className={[
                        "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                        isUser
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap bg-blue-600 text-white rounded-br-sm",
                    ].join(" ")}
                >
                    {content || <span className="opacity-0">…</span>}
                </div>
                {isUser && <div className="shrink-0 mt-1 size-6 rounded-full bg-gray-300/80 dark:bg-white/20" />}
            </div>
        </div>
    );
}