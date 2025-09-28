import React from "react";

export default React.memo(function Bubble({ role, content }: {
    role: "user" | "assistant";
    content: string;
}) {
    const isUser = role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className="flex items-start gap-3 max-w-[80%]">
                {!isUser && (
                    <div className="shrink-0 mt-1 size-6 flex items-center justify-center rounded-full bg-blue-500 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h6v6H9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l1.414 1.414M6.05 6.05L4.636 4.636" />
                        </svg>
                    </div>
                )}
                <div
                    className={[
                        "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                        isUser
                            ? "bg-gray-500 text-white rounded-br-sm"
                            : "bg-blue-500 text-white rounded-br-sm",
                    ].join(" ")}
                >
                    {content || <span className="opacity-0">…</span>}
                </div>
                {isUser && (
                    <div className="shrink-0 mt-1 size-6 flex items-center justify-center rounded-full bg-gray-300/80 text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.72 5.879 1.928M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}, (prev, next) => prev.role === next.role && prev.content === next.content);
