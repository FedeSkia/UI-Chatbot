import React from "react";
import MsgBox from "./MsgBox.tsx";
import type {AiMsg, ToolMsg} from "./Chat.tsx";
import {renderBotAvatar} from "./Thinking.tsx";
import {RenderThinkingLastMsg} from "./ThinkingLastMsg.tsx";

function ThinkingBubble() {
    return (
        <div className="thinking-bubble flex items-center space-x-1">
            <span className="dot animate-blink delay-0"/>
            <span className="dot animate-blink delay-200"/>
            <span className="dot animate-blink delay-400"/>
        </div>
    );
}

interface AiLastMsgComponentProps {
    toolMsgs: ToolMsg[] | null,
    aiMsg: AiMsg | null,
    showThinking: boolean,
    setShowThinking: (value: ((prevState: boolean) => boolean) | boolean) => void,
}

function renderAiMsg(aiMsg: AiMsg, setShowThinking: (value: (((prevState: boolean) => boolean) | boolean)) => void, showThinking: boolean, toolMsgs: ToolMsg[] | null) {
    return <div className="rounded-2xl border border-blue-200 bg-blue-50 shadow-sm px-3 py-2 text-sm w-full">
        {/* Visible AI answer */}
        {aiMsg.content.length > 0 && (<MsgBox html={aiMsg.content}/>)}

        {/* Optional thinking section INSIDE the same box */}
        {RenderThinkingLastMsg(aiMsg, setShowThinking, showThinking, toolMsgs)}
    </div>;
}

function shouldReRender(prev: AiLastMsgComponentProps, next: AiLastMsgComponentProps) {
    if (prev.aiMsg == null || next.aiMsg == null) return true;
    return prev.aiMsg.content === next.aiMsg.content && prev.aiMsg.thinkingContent === next.aiMsg.thinkingContent;
}

export default React.memo(function AiLastMsgComponent({
                                                          aiMsg,
                                                          showThinking,
                                                          setShowThinking,
                                                          toolMsgs
                                                      }: AiLastMsgComponentProps) {

        return (
            <div className="flex justify-start">
                <div className="flex items-start gap-3 w-[85%]">

                    {/* Bot avatar */}
                    {renderBotAvatar()}
                    {aiMsg == null ? <ThinkingBubble/> : renderAiMsg(aiMsg, setShowThinking, showThinking, toolMsgs)}
                </div>
            </div>
        );
    }, (prev, next) => {
        return shouldReRender(prev, next);
    }
);