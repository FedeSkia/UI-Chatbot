import {useState} from "react";
import MsgBox from "./MsgBox.tsx";
import type {AiMsg} from "./Chat.tsx";
import {renderBotAvatar, renderThinking} from "./Thinking.tsx";

export default function AiMsgComponent({aiMsg}: { aiMsg: AiMsg }) {
    const [showThinking, setShowThinking] = useState(false);

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
}