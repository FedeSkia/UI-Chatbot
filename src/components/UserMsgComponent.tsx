import MsgBox from "./MsgBox.tsx";
import type {UserMsg} from "./Chat.tsx";

export default function UserMsgComponent({userMsg}: {
    userMsg: UserMsg;
}) {
    return (
        <div className="flex justify-end">
            <div className="gap-3 w-max[85%]">
                <div className="flex justify-end items-center justify-right rounded-full text-gray-700">
                    {/* user icon */}
                    <svg width="32px" height="32px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                            <path
                                d="M8 7C9.65685 7 11 5.65685 11 4C11 2.34315 9.65685 1 8 1C6.34315 1 5 2.34315 5 4C5 5.65685 6.34315 7 8 7Z"
                                fill="#000000"></path>
                            <path d="M14 12C14 10.3431 12.6569 9 11 9H5C3.34315 9 2 10.3431 2 12V15H14V12Z"
                                  fill="#000000"></path>
                        </g>
                    </svg>

                    {/* Fixed width message box */}
                    <div className="bg-gray-50 rounded-2xl w-[85%] p-2">
                        <MsgBox html={userMsg.content}/>
                    </div>
                </div>
            </div>
        </div>
    );
};