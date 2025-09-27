import { useMemo, useState } from "react";
import type {UserConversationThread, UserConversationThreadsResponse} from "../lib/conversationMessagesResponse";
import { orderConversationThreads } from "../lib/documents";
import DeleteDocumentModal from "./DeleteDocumentModal";

export default function Sidebar({
                                    activeThreadId,
                                    conversationThreads,
                                    onSelect,
                                    onNew,
                                    isChatBotResponding,
                                    onDelete, // parent deletion callback
                                }: {
    activeThreadId: string | null | undefined;
    conversationThreads: UserConversationThreadsResponse | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    isChatBotResponding: boolean;
    onDelete: (id: string) => void | Promise<void>;
}) {
    const userConversationThreadsOrderedByDate = useMemo(
        orderConversationThreads(conversationThreads),
        [conversationThreads]
    );

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] =
        useState<"confirm" | "deleting" | "success" | "error" | "Not found">("confirm");
    const [deleteConversationModalMsg, setDeleteConversationModalMsg] = useState<string | undefined>(undefined);
    const [selectedThreadToDelete, setSelectedThreadToDelete] = useState<string | null>(null);

    function openDeleteConfirm(threadId: string) {
        setSelectedThreadToDelete(threadId);
        setDeleteConversationModalMsg(undefined);
        setModalMode("confirm");
        setModalOpen(true);
    }

    async function confirmDelete() {
        if (!selectedThreadToDelete) return;
        try {
            setModalMode("deleting");
            // Call parent delete (can be async)
            await onDelete(selectedThreadToDelete);
            setModalMode("success");
            setDeleteConversationModalMsg("Conversation has been deleted.");
        } catch (e: any) {
            setModalMode("error");
            setDeleteConversationModalMsg(e?.message || "Delete failed.");
        }
    }

    function closeModal() {
        setModalOpen(false);
        setSelectedThreadToDelete(null);
        setDeleteConversationModalMsg(undefined);
    }

    function textToDisplay(thread: UserConversationThread) {
        if(thread.has_msg) {
            return <div className="text-[11px] text-black">
                Conversation started
                on {new Date(thread.updated_at).toLocaleString()}
            </div>
        } else {
            return <div className="text-[11px] text-black">
                Empty conversation
            </div>
        }
    }

    return (
        <aside
            className={[
                "shrink-0 relative transition-all duration-300",
                "w-[clamp(240px,24vw,380px)]",
                "aria-expanded: true",
            ].join(" ")}
        >
            {/* Panel */}
            <div
                className="aria-hidden:false h-[calc(100vh-2rem)] sticky top-4 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-md flex flex-col">
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
                <div className="p-2 overflow-y-auto divide-y divide-gray-200" tabIndex={0}>
                    {userConversationThreadsOrderedByDate.length === 0 ? (
                        <div className="text-xs text-gray-500 px-2 py-3">No conversation yet. Create one</div>
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
                                                active ? "bg-blue-50 border-blue-600" : "border-gray-200 hover:bg-gray-50",
                                            ].join(" ")}
                                            tabIndex={0}
                                        >
                                            <div
                                                className={[
                                                    "mt-1 size-2.5 rounded-full",
                                                    active ? "bg-blue-600" : "bg-gray-400",
                                                ].join(" ")}
                                            />
                                            <div className="min-w-0 flex-1">
                                                {textToDisplay(thread)}
                                            </div>

                                            {/* Delete icon */}
                                            <span
                                                aria-busy={isChatBotResponding}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isChatBotResponding) {
                                                        return;
                                                    } else {
                                                        openDeleteConfirm(thread.thread_id);
                                                    }
                                                }}
                                                className={`ml-2 ${isChatBotResponding ? "text-gray-300 cursor-not-allowed" : "text-red-500 hover:text-red-700 cursor-pointer"}`}
                                                title="Delete conversation"
                                            >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-6 4h8"
                          />
                        </svg>
                      </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Delete modal */}
            <DeleteDocumentModal
                open={modalOpen}
                mode={modalMode}
                subjectLabel="conversation"
                name={selectedThreadToDelete || undefined}
                message={deleteConversationModalMsg}
                onConfirm={confirmDelete}
                onClose={closeModal}
            />
        </aside>
    );
}