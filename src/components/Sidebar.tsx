import { useState } from "react";
import type {UserConversationThread} from "../lib/conversationMessagesResponse";
import DeleteDocumentModal from "./DeleteDocumentModal";
import {useAppBusy} from "../context/AppBusyContext.tsx";

export default function Sidebar({
                                    activeThreadId,
                                    conversationThreads,
                                    onSelect,
                                    onNew,
                                    onDelete, // parent deletion callback
                                }: {
    activeThreadId: string | null | undefined;
    conversationThreads: UserConversationThread[];
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void | Promise<void>;
}) {

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] =
        useState<"confirm" | "deleting" | "success" | "error" | "Not found">("confirm");
    const [deleteConversationModalMsg, setDeleteConversationModalMsg] = useState<string | undefined>(undefined);
    const [selectedThreadToDelete, setSelectedThreadToDelete] = useState<string | null>(null);
    const {isBusy} = useAppBusy();

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
            console.error(e);
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
                "flex flex-col h-full shrink-0 relative transition-all duration-300",
                "w-[clamp(240px,24vw,380px)]",
                "aria-expanded: true",
            ].join(" ")}
        >
            {/* Sidebar wrapper — full height */}
            <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-gray-400 bg-white shadow-md overflow-hidden">

                {/* Header (static) */}
                <div className="shrink-0 px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">Conversations</div>
                    </div>
                    <button
                        aria-busy={isBusy}
                        disabled={isBusy}
                        onClick={onNew}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + New
                    </button>
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-200" tabIndex={0}>
                    {conversationThreads.length === 0 ? (
                        <div className="text-xs text-gray-500 px-2 py-3">No conversation yet. Create one</div>
                    ) : (
                        <ul className="space-y-2">
                            {conversationThreads.map((thread) => {
                                const active = thread.thread_id === activeThreadId;
                                return (
                                    <li key={thread.thread_id}>
                                        <button
                                            disabled={isBusy}
                                            onClick={() => {
                                                if (isBusy) return;
                                                onSelect(thread.thread_id);
                                            }}
                                            className={[
                                                "w-full group flex items-start gap-2 px-3 py-2 rounded-lg text-left border transition-colors",
                                                active ? "bg-blue-50 border-blue-600" : "border-gray-200 hover:bg-gray-50",
                                                isBusy ? "opacity-50 cursor-not-allowed" : "",
                                            ].join(" ")}
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
                                                aria-busy={isBusy}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isBusy) return;
                                                    openDeleteConfirm(thread.thread_id);
                                                }}
                                                className={`ml-2 ${isBusy
                                                    ? "text-gray-300 cursor-not-allowed"
                                                    : "text-red-500 hover:text-red-700 cursor-pointer"
                                                }`}
                                                title="Delete conversation"
                                            >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-6 4h8"/>
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