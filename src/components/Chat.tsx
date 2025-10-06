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
import UserMsgComponent from "./UserMsgComponent.tsx";
import AiMsgComponent from "./AiMsgComponent.tsx";


export type UserMsg = { id: number; content: string; };
export type AiMsg = { id: number; content: string; thinkingContent: string };

type Msg = UserMsg | AiMsg;

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
                return;
            }
            const messages: Msg[] = [];
            for (let i = 0; i < res.messages.length; i++) {
                const msg = res.messages[i];
                if (msg.type === "human") {
                    messages.push({
                        id: i,
                        content: msg.content,
                    });
                } else {
                    const msg = res.messages[i];
                    const thinkingContent = keepOnlyThinking(msg.content);
                    const finalMsgContent = removeThinking(msg.content);
                    messages.push({
                        id: i,
                        content: finalMsgContent ?? "",
                        thinkingContent: thinkingContent ?? ""
                    });
                }
            }
            setMessages(messages);

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
            setMessages([])
            setInput("");
        }
    }, [threadId]);

    function isUserMsg(m: Msg): m is UserMsg {
        return !isAiMsg(m);
    }
    function isAiMsg(m: Msg): m is AiMsg {
        return "thinkingContent" in m;
    }

    function keepOnlyThinking(text: string): string {
        const matches = text.matchAll(/<think>([\s\S]*?)<\/think>/g);
        return Array.from(matches, m => m[1].trim()).join("\n\n");
    }

    function removeThinking(text: string): string {
        return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    }

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

    function addChunkToThinkingMsg(msgId: number, chunk: string) {
        setMessages(prev =>
            prev.map(m => {
                if (m.id !== msgId) return m;
                if (isAiMsg(m)) {
                    return {
                        ...m,
                        thinkingContent: (m.thinkingContent ?? "") + chunk,
                    };
                }
                return m;
            })
        );
    }

    function addChunkToFinalMsg(msgId: number, chunk: string) {
        setMessages(prev =>
            prev.map(m => {
                if (m.id !== msgId) return m;
                if (isUserMsg(m)) {
                    return {
                        ...m,
                        content: (m.content ?? "") + chunk,
                    };
                }
                return m;
            })
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

        const newUsrMsgId = messages.length + 1;
        // setUserMessages((m) => {
        //     const userMsg = {id: newUsrMsgId, content: text};
        //     return [...m, userMsg];
        // });

        const newAiMsgId = newUsrMsgId + 1;
        setMessages((m) => {
            const userMsg = {id: newUsrMsgId, content: text};
            const aiMsg = {id: newAiMsgId, content: "", thinkingContent: ""};
            return [...m, userMsg, aiMsg];
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
                if (bufferRef.match(openingThinkTag)) {
                    isAiThinking = true;
                    bufferRef = "";
                } else if (bufferRef.match(closingThinkTag)) {
                    isAiThinking = false;
                    bufferRef = "";
                }

                if (isAiThinking) {
                    addChunkToThinkingMsg(newAiMsgId, chunk);
                } else {  // update assistant visible text
                    addChunkToFinalMsg(newAiMsgId, chunk);
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

    function renderMessages() {

        return (
            <div>
                {messages.map((msg, idx) =>
                    isUserMsg(msg) ? (
                        <UserMsgComponent key={idx} userMsg={msg}/>
                    ) : (
                        <AiMsgComponent key={idx} aiMsg={msg}/>
                    )
                )}
            </div>
        );

    }

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
                {renderMessages()}
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