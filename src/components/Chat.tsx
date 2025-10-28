import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {getToken, setRefreshToken, setToken} from "../lib/auth";
import {useLocation, useNavigate} from "react-router-dom";
import {refreshToken} from "../lib/refreshToken";
import {
    getConversationData,
    getUserThreads, type UserConversationThread
} from "../lib/conversationMessagesResponse";
import {useAppBusy} from "../context/AppBusyContext.tsx";
import UserMsgComponent from "./UserMsgComponent.tsx";
import AiMsgsBelongingToSameRequestComponent from "./AiMsgComponent.tsx";
import AiLastMsgComponent from "./AiLastMsgComponent.tsx";


export type UserMsg = { id: number; content: string; interaction_id: string };
export type AiMsg = { id: number; content: string; thinkingContent: string; interaction_id: string };
export type ToolMsg = { page_content: string; page_number: number; document_name: string }
type Msg = UserMsg | AiMsg;

const openingThinkTag = /<think>/;
const closingThinkTag = /<\/think>/;

export default function Chat({apiUrl, threadId, updateCurrentThreadId, setConversationThreads}: {
    apiUrl: string,
    threadId: string | null,
    updateCurrentThreadId: (id: string) => void,
    setConversationThreads: (value: (((prevState: (UserConversationThread[])) => (UserConversationThread[])) | UserConversationThread[])) => void,
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

    const [showLastMsgThinking, setShowLastMsgThinking] = useState<boolean>(true);
    const [currentAiMsg, setCurrentAiMsg] = useState<AiMsg | null>(null);
    const [currentToolMsgs, setCurrentToolMsgs] = useState<ToolMsg[] | null>(null);

    const retrieveMsgsFromApi = useCallback(async (): Promise<Msg[] | undefined> => {
        if (!threadId) return;
        const res = await getConversationData(threadId);

        if (!res.ok) {
            if (res.error === "Unauthenticated") {
                navigate("/login", {replace: true, state: {from: location}});
            }
            return;
        }

        const messages: Msg[] = [];
        for (let i = 0; i < res.messages.length; i++) {
            const m = res.messages[i];
            if (m.type === "human") {
                messages.push({id: i, content: m.content, interaction_id: m.interaction_id});
            } else {
                const thinkingContent = keepOnlyThinking(m.content);
                const finalMsgContent = removeThinking(m.content);
                messages.push({
                    id: i,
                    content: finalMsgContent ?? "",
                    thinkingContent: thinkingContent ?? "",
                    interaction_id: m.interaction_id
                });
            }
        }
        return messages;
    }, [threadId, navigate, location]);

    useEffect(() => {
        if (!getToken()) {
            navigate("/login", {replace: true, state: {from: location}});
        }
    }, [location, navigate]);

    useEffect(() => {
        (async () => {
            const messagesFromApi = await retrieveMsgsFromApi();
            if (!messagesFromApi) return;
            setMessages(messagesFromApi);
        })();

    }, [navigate, location, retrieveMsgsFromApi]);

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
        let headers: Record<string, string>;
        if (!threadId || threadId === "tmp") { //do not send it
            headers = {
                "Content-Type": "application/json",
                accept: "application/json",
                Authorization: `Bearer ${getToken() || ""}`
            };
        } else {
            headers = {
                "Content-Type": "application/json",
                accept: "application/json",
                Authorization: `Bearer ${getToken() || ""}`,
                'X-Thread-Id': threadId,
            };
        }

        return await fetch(`${apiUrl}/api/chat/invoke`, {
            method: "POST",
            headers,
            body: JSON.stringify({content: text}),
        });
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

    function addChunkToThinkingMsg(chunk: string) {
        setCurrentAiMsg(prev => {
            return {
                id: prev ? prev.id : messages.length + 1,
                content: prev ? prev.content : "",
                thinkingContent: prev ? prev.thinkingContent + chunk : chunk,
                interaction_id: prev ? prev.interaction_id : "",
            }
        });
    }

    function addChunkToFinalMsg(chunk: string) {
        setCurrentAiMsg(prev => {
            return {
                id: prev ? prev.id : messages.length + 1,
                content: prev ? prev.content + chunk : "",
                thinkingContent: prev ? prev.thinkingContent : "",
                interaction_id: prev ? prev.interaction_id : "",
            }
        });
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
        setMessages((m) => {
            const userMsg = {id: newUsrMsgId, content: text, interaction_id: "new_interaction_id"};
            return [...m, userMsg];
        });

        try {
            setBusy(true);
            let response = await sendMsg(text);
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

                if (chunk.includes("TOOL_MSG")) {
                    try {
                        const jsonToolMsg = chunk.replace("TOOL_MSG:", "");
                        const toolMsg: ToolMsg[] = JSON.parse(jsonToolMsg);
                        setCurrentToolMsgs(toolMsg);
                        continue;
                    } catch (e) { /* empty */
                    }
                }
                bufferRef += chunk;
                // if the chunk starts a <think> block — show the "thinking" bubble right away
                if (bufferRef.match(openingThinkTag)) {
                    isAiThinking = true;
                    bufferRef = "";
                } else if (bufferRef.match(closingThinkTag)) {
                    isAiThinking = false;
                    bufferRef = "";
                }

                if (isAiThinking) {
                    addChunkToThinkingMsg(chunk);
                } else {  // update assistant visible text
                    addChunkToFinalMsg(chunk);
                }

            }


        } catch (e) {
            console.error(e);
        } finally {
            if (!threadId || threadId === "tmp") {
                // refresh the sidebar list after the first message created a new thread
                getUserThreads().then(res => {
                    if (!res.ok && res.error === "Unauthenticated") {
                        navigate("/login", {replace: true});
                        return;
                    }
                    setConversationThreads(res.threads);
                    updateCurrentThreadId(res.threads[0].thread_id)
                });
            }
            retrieveMsgsFromApi()
                .then(msgs => {
                    if (msgs) {
                        setMessages(msgs);
                    }
                    setCurrentAiMsg(null);
                    setCurrentToolMsgs(null);
                    scrollToBottom();
                    setBusy(false);
                });
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey && canSend) {
            e.preventDefault();
            handleSend();
        }
    };

    function renderMessages() {
        const messagesGroupedByInteractionId = messages.reduce<Record<string, Msg[]>>((acc, msg) => {
            const key = msg.interaction_id;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(msg);
            return acc;
        }, {});

        const renderedMsgs = [];
        for (const [interaction_id, msgs] of Object.entries(messagesGroupedByInteractionId)) {
            const aiMsgs: AiMsg[] = [];
            for (let i = 0; i < msgs.length; i++) {
                const msg = msgs[i];
                if (isUserMsg(msg)) {
                    renderedMsgs.push(<UserMsgComponent key={interaction_id} userMsg={msg}/>);
                } else if (isAiMsg(msg)) {
                    const aiMsg: AiMsg = msg;
                    if (aiMsg.content.length > 0 || aiMsg.thinkingContent.length > 0) {
                        aiMsgs.push(msg);
                    }
                }
            }
            if (aiMsgs.length > 0) {
                renderedMsgs.push(<AiMsgsBelongingToSameRequestComponent key={renderedMsgs.length + 1}
                                                                         aiMsgs={aiMsgs}/>)
            }

        }
        return (
            <div ref={viewportRef}
                 className="flex-1 min-h-[50svh] sm:min-h-0 overflow-y-auto px-2 sm:px-4 py-4 space-y-2 sm:space-y-4">
                {renderedMsgs}
            </div>
        );
    }

    function renderLastAiMsg() {
        if (currentAiMsg) {
            return <AiLastMsgComponent aiMsg={currentAiMsg} showThinking={showLastMsgThinking}
                                       setShowThinking={setShowLastMsgThinking} toolMsgs={currentToolMsgs}/>
        } //flex flex-col h-screen max-h-screen border rounded-xl
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <header className="shrink-0 flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="text-sm font-semibold">Chat AI</div>
                <div className="text-xs text-gray-500">Online</div>
            </header>

            {/* Messages area — scrollable */}
            <section
                ref={viewportRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
            >
                {renderMessages()}
                {renderLastAiMsg()}
            </section>

            {/* Footer — static at bottom */}
            <footer className="shrink-0 border-t border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2 py-2">
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" d="M22 2L11 13" />
                            <path strokeWidth="2" d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                        Send
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Press send</p>
            </footer>
        </div>
    );
}