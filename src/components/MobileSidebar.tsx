import {useEffect, useMemo} from "react";
import type {UserConversationThreadsResponse} from "../lib/conversationMessagesResponse.ts";
import {orderConversationThreads} from "../lib/documents.ts";

export default function MobileSidebar({
                                          isMobileSideBarOpen,
                                          conversationThreads,
                                          activeThreadId,
                                          onSelect,
                                          onNew,
                                          isChatBotResponding,
                                          setIsMobileSidebarOpen
                                      }: {
    isMobileSideBarOpen: boolean,
    conversationThreads: UserConversationThreadsResponse | null,
    activeThreadId: string | null,
    onSelect: (threadId: string) => void,
    onNew: () => void,
    isChatBotResponding: boolean,
    setIsMobileSidebarOpen: (value: (((prevState: boolean) => boolean) | boolean)) => void
}) {
    // lock background scroll when open
    useEffect(() => {
        if (!isMobileSideBarOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isMobileSideBarOpen]);

    const userConversationThreadsOrderedByDate = useMemo(orderConversationThreads(conversationThreads), [conversationThreads]);


    if (!isMobileSideBarOpen) return null;

    return (
        // Overlay container (only on mobile)
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            {/* Backdrop (click to close) */}
            <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                aria-label="Close sidebar"
            />

            {/* Drawer panel (LEFT) — do NOT use inset-0 here */}
            <aside
                className="absolute left-0 top-0 h-full w-[85vw] max-w-[360px]
                   bg-white border-r border-gray-200 shadow-xl
                   animate-[slideIn_.2s_ease-out_forwards]"
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
                    <div className="text-sm font-semibold">Conversations</div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                            title="Close"
                        >
                            Close
                        </button>
                        <button
                            aria-busy={isChatBotResponding}
                            disabled={isChatBotResponding}
                            onClick={onNew}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            + New
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="p-2 overflow-y-auto h-[calc(100%-49px)] divide-y divide-gray-200">
                    {userConversationThreadsOrderedByDate.length === 0 ? (
                        <div className="text-xs text-gray-500 px-2 py-3">
                            No conversation yet. Create one
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {userConversationThreadsOrderedByDate.map((thread) => {
                                const active = thread.thread_id === activeThreadId;
                                return (
                                    <li key={thread.thread_id}>
                                        <button
                                            aria-busy={isChatBotResponding}
                                            disabled={isChatBotResponding}
                                            onClick={() => {
                                                onSelect(thread.thread_id);
                                                // close drawer after selecting
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            className={[
                                                "w-full group flex items-start gap-2 px-3 py-2 rounded-lg text-left border transition-colors",
                                                active ? "bg-blue-50 border-blue-600" : "border-gray-200 hover:bg-gray-50",
                                            ].join(" ")}
                                        >
                                            <div className={["mt-1 size-2.5 rounded-full", active ? "bg-blue-600" : "bg-gray-400"].join(" ")} />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[11px] text-black">
                                                    Conversation started on {new Date(thread.updated_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>

            {/* keyframe for slide-in */}
            <style>{`
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
        </div>
    );
}