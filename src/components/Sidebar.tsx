import { useMemo } from "react";
import type { UserConversationThreadsResponse } from "../lib/conversationMessagesResponse.ts";

export default function Sidebar({
                                    activeThreadId,
                                    conversationThreads,
                                    onSelect,
                                    onNew,
                                    isChatBotResponding,
                                    sidebarOpen
                                }: {
    activeThreadId: string | null;
    conversationThreads: UserConversationThreadsResponse | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    isChatBotResponding: boolean;
    sidebarOpen: boolean;
}) {

    const userConversationThreadsOrderedByDate = useMemo(() => {
        if (conversationThreads) {
            return [...conversationThreads.threads].sort(
                (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
            );
        }
        return [];
    }, [conversationThreads]);

    return (
        <aside
            className={[
                "shrink-0 relative transition-all duration-300",
                // When open, use responsive width; when closed, keep a slim rail so the toggle stays accessible
                sidebarOpen ? "w-[clamp(240px,24vw,380px)]" : "w-0",
            ].join(" ")}
            aria-expanded={sidebarOpen}
        >
            {/* The actual panel */}
            <div
                className={[
                    "h-[calc(100vh-2rem)] sticky top-4 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-md flex flex-col",
                    // When closed, hide inner content from a11y and tab order
                    sidebarOpen ? "" : "pointer-events-none",
                ].join(" ")}
                aria-hidden={!sidebarOpen}
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">Conversations</div>
                    </div>
                    <button
                        aria-busy={isChatBotResponding}
                        disabled={isChatBotResponding}
                        onClick={onNew}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + New
                    </button>
                </div>

                {/* List */}
                <div
                    className="p-2 overflow-y-auto divide-y divide-gray-200"
                    // prevent tabbing when closed
                    tabIndex={sidebarOpen ? 0 : -1}
                >
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
                                            onClick={() => onSelect(thread.thread_id)}
                                            className={[
                                                "w-full group flex items-start gap-2 px-3 py-2 rounded-lg text-left border transition-colors",
                                                active
                                                    ? "bg-blue-50 border-blue-600"
                                                    : "border-gray-200 hover:bg-gray-50",
                                            ].join(" ")}
                                            tabIndex={sidebarOpen ? 0 : -1}
                                        >
                                            <div
                                                className={[
                                                    "mt-1 size-2.5 rounded-full",
                                                    active ? "bg-blue-600" : "bg-gray-400",
                                                ].join(" ")}
                                            />
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
            </div>
        </aside>
    );
}