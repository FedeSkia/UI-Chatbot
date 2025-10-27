import type {AiMsg, ToolMsg} from "./Chat.tsx";
import MsgBox from "./MsgBox.tsx";
import {useEffect, useState} from "react";

export function renderBotAvatar() {
    return <div
        className="shrink-0 mt-1 size-6 flex items-center justify-center rounded-full text-white">
        <svg width="32px" height="32px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
             fill="#000000">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M8.48 4h4l.5.5v2.03h.52l.5.5V8l-.5.5h-.52v3l-.5.5H9.36l-2.5 2.76L6 14.4V12H3.5l-.5-.64V8.5h-.5L2 8v-.97l.5-.5H3V4.36L3.53 4h4V2.86A1 1 0 0 1 7 2a1 1 0 0 1 2 0 1 1 0 0 1-.52.83V4zM12 8V5H4v5.86l2.5.14H7v2.19l1.8-2.04.35-.15H12V8zm-2.12.51a2.71 2.71 0 0 1-1.37.74v-.01a2.71 2.71 0 0 1-2.42-.74l-.7.71c.34.34.745.608 1.19.79.45.188.932.286 1.42.29a3.7 3.7 0 0 0 2.58-1.07l-.7-.71zM6.49 6.5h-1v1h1v-1zm3 0h1v1h-1v-1z"></path>
            </g>
        </svg>
    </div>;
}

export function RenderThinking(aiMsgs: AiMsg[], setShowThinking: (value: (((prevState: boolean) => boolean) | boolean)) => void, showThinking: boolean, toolMsg: ToolMsg[] | null) {
    const [thinkingTxt, setThinkingTxt] = useState("");
    useEffect(() => {
        if (aiMsgs.length > 0) {
            setThinkingTxt(groupAiMessages(aiMsgs));
        }
    }, [aiMsgs]); // empty deps => only runs once when component mounts



    function formatToolMsg(): string {
        if(toolMsg == null) {
            return "";
        }
        const msgsAsMap = toolMsg.reduce((acc, {document_name, page_number}) => {
            if (!acc.has(document_name)) {
                acc.set(document_name, []);
            }
            acc.get(document_name)!.push(page_number);
            return acc;
        }, new Map<string, number[]>());

        return "Found text matching in the following documents and pages: " + Array.from(msgsAsMap.entries())
            .map(([name, pages]) =>
                `- **${name}** → pages ${[...pages].sort((a, b) => a - b).join(", ")}`
            )
            .join("\n");
    }

    function groupAiMessages(messages: AiMsg[]) {
        return messages.map(message => {
            return message.thinkingContent;
        }).join();
    }

    return <>
        {aiMsgs.length > 0 && (
            <div className="mt-2">
                <button
                    type="button"
                    onClick={() => setShowThinking(!showThinking)}
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200"
                    aria-expanded={showThinking}
                >
                    <span>🧠 {showThinking ? "Hide reasoning" : "Show reasoning"}</span>
                </button>

                {showThinking && thinkingTxt.length > 0 && (
                    <div>
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <MsgBox html={thinkingTxt}/>
                        </div>
                        {toolMsg != null && toolMsg.length > 0 ? <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <MsgBox html={formatToolMsg()}/>
                        </div> : null}
                    </div>
                )}
            </div>
        )}
    </>;
}
