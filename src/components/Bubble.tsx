import React, {useState} from "react";
import MsgBox from "./MsgBox.tsx";

export default React.memo(function Bubble({role, content}: {
    role: "user" | "assistant" | "assistant-thinking";
    content: string;
}) {
    const [showThinking, setShowThinking] = useState(false);

    const isUser = role === "user";
    const isAiThinking = role === "assistant-thinking";
    const isAiResponse = role === "assistant";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className="flex items-start gap-3 max-w-[90%]">
                {isAiResponse && (
                    <div
                        className=" flex items-center justify-center rounded-full  text-white">
                        {/* bot icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h6v6H9z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l1.414 1.414M6.05 6.05L4.636 4.636"/>
                        </svg>
                          <div className={"bg-blue-50 rounded-2xl"}>
                            <MsgBox html={content} />
                        </div>
                    </div>
                )}

                {isUser && (
                    <div
                        className="flex items-center justify-center rounded-full bg-gray-300/80 text-gray-700">
                        {/* user icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.72 5.879 1.928M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <div className={"bg-gray-50 rounded-2xl"}>
                            <MsgBox html={content} />
                        </div>
                    </div>
                )}
                {isAiThinking && showThinking && (
                    <div className="flex justify-start">
                        <div
                            className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-amber-50 border border-amber-200 text-amber-900">
                            <button
                                type="button"
                                onClick={() => setShowThinking((v) => !v)}
                                className="mb-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-amber-100 hover:bg-amber-200"
                            >
                                <span>🧠 Thinking</span>
                                <span className="opacity-70">{showThinking ? "Hide" : "Show"}</span>
                            </button>
                            {showThinking && (
                                <pre className="whitespace-pre-wrap font-mono text-xs leading-5 mt-1">
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-5 mt-1">
                          <div className={"bg-blue-50 rounded-2xl"}>
                            <MsgBox html={content} />
                        </div>
                        </pre>
                        </pre>
                            )}
                        </div>
                    </div>
                )}
                {isAiThinking && !showThinking && (
                    <div className="flex justify-start">
                        <div
                            className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-amber-50 border border-amber-200 text-amber-900">
                            <button
                                type="button"
                                onClick={() => setShowThinking((v) => !v)}
                                className="mb-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-amber-100 hover:bg-amber-200"
                            >
                                <span>🧠 Thinking</span>
                                <span className="opacity-70">{showThinking ? "Hide" : "Show"}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}, (prev, next) => prev.role === next.role && prev.content === next.content);