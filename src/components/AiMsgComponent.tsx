import React, {useState} from "react";
import MsgBox from "./MsgBox.tsx";
import type {AiMsg} from "./Chat.tsx";

export default React.memo(function AiMsgComponent({aiMsg}: {
    aiMsg: AiMsg;
}) {
    const [showThinking, setShowThinking] = useState(false);

    return (
        <div className={`flex justify-start`}>
            <div className="flex items-start gap-3 max-w-[90%]">

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
                            <MsgBox html={aiMsg.content} />
                        </div>
                    </div>

                {aiMsg.thinkingContent && showThinking && (
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
                            <MsgBox html={aiMsg.thinkingContent} />
                        </div>
                        </pre>
                        </pre>
                            )}
                        </div>
                    </div>
                )}
                {aiMsg.thinkingContent && !showThinking && (
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
}, (prev, next) => prev.aiMsg.content === next.aiMsg.content && prev.aiMsg.thinkingContent === next.aiMsg.thinkingContent);