import React from "react";
import MsgBox from "./MsgBox.tsx";
import type {UserMsg} from "./Chat.tsx";

export default React.memo(function UserMsgComponent({userMsg}: {
    userMsg: UserMsg;
}) {

    return (
        <div className={`flex justify-end`}>
            <div className="flex items-start gap-3 max-w-[90%]">

                <div
                    className="flex items-center justify-center rounded-full bg-gray-300/80 text-gray-700">
                    {/* user icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.72 5.879 1.928M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <div className={"bg-gray-50 rounded-2xl"}>
                        <MsgBox html={userMsg.content}/>
                    </div>
                </div>

            </div>
        </div>
    );
}, (prev, next) => prev.userMsg.content === next.userMsg.content);