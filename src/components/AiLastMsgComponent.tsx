import React from "react";
import MsgBox from "./MsgBox.tsx";
import type {AiMsg} from "./Chat.tsx";
import {renderBotAvatar, renderThinking} from "./Thinking.tsx";

export default React.memo(function AiLastMsgComponent({aiMsg, showThinking, setShowThinking}: { aiMsg: AiMsg, showThinking: boolean, setShowThinking: any }) {


        return (
            <div className="flex justify-start">
                <div className="flex items-start gap-3 w-[85%]">

                    {/* Bot avatar */}
                    {renderBotAvatar()}

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 shadow-sm px-3 py-2 text-sm w-full">
                        {/* Visible AI answer */}
                        <MsgBox html={aiMsg.content}/>

                        {/* Optional thinking section INSIDE the same box */}
                        {renderThinking(aiMsg, setShowThinking, showThinking)}
                    </div>
                </div>
            </div>
        );
    }, (prev, next) =>
        prev.aiMsg.content === next.aiMsg.content &&
        prev.aiMsg.thinkingContent === next.aiMsg.thinkingContent
);