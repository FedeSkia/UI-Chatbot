import {useEffect, useState} from "react";
import MsgBox from "./MsgBox.tsx";
import type {AiMsg} from "./Chat.tsx";
import {renderBotAvatar, RenderThinking} from "./Thinking.tsx";

export default function AiMsgComponent({aiMsgs}: { aiMsgs: AiMsg[] }) {
    const [showThinking, setShowThinking] = useState(false);
    const [aiText, setAiText] = useState("");

    useEffect(() => {
        console.log("AiMsgComponent");
        setAiText(groupAiMessages(aiMsgs))
    }, [aiMsgs])

    function groupAiMessages(messages: AiMsg[]) {
        return messages.map(message => {
            return message.content;
        }).join();
    }

    function renderAiResponseIfTextIsPresent() {
        return <>
            {aiText.length > 0 && (
                <MsgBox html={groupAiMessages(aiMsgs)}/>
            )}
        </>;
    }

    return (
        <div className="flex justify-start">
            <div className="flex items-start gap-3 w-[85%]">

                {/* Bot avatar */}
                {renderBotAvatar()}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 shadow-sm px-3 py-2 text-sm w-full">
                    {/* Visible AI answer */}
                    {renderAiResponseIfTextIsPresent()}

                    {/* Optional thinking section INSIDE the same box */}
                    {RenderThinking(aiMsgs, setShowThinking, showThinking, null)}
                </div>
            </div>
        </div>
    );
}