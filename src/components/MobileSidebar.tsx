import { useEffect, useState } from "react";
import type {UserConversationThread} from "../lib/conversationMessagesResponse";
import DeleteDocumentModal from "./DeleteDocumentModal";
import {useAppBusy} from "../context/AppBusyContext.tsx";

export default function MobileSidebar({
                                          isMobileSideBarOpen,
                                          conversationThreads,
                                          activeThreadId,
                                          onSelect,
                                          onNew,
                                          setIsMobileSidebarOpen,
                                          onDelete, // ← add this prop
                                      }: {
    isMobileSideBarOpen: boolean;
    conversationThreads: UserConversationThread[];
    activeThreadId: string | null | undefined;
    onSelect: (threadId: string) => void;
    onNew: () => void;
    setIsMobileSidebarOpen: (value: (((prevState: boolean) => boolean) | boolean)) => void;
    onDelete: (id: string) => void | Promise<void>;
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

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] =
        useState<"confirm" | "deleting" | "success" | "error" | "Not found">("confirm");
    const [modalMsg, setModalMsg] = useState<string | undefined>(undefined);
    const [selectedThreadToDelete, setSelectedThreadToDelete] = useState<string | null>(null);
    const {isBusy} = useAppBusy();

    function openDeleteConfirm(threadId: string) {
        setSelectedThreadToDelete(threadId);
        setModalMsg(undefined);
        setModalMode("confirm");
        setModalOpen(true);
    }

    async function confirmDelete() {
        if (!selectedThreadToDelete) return;
        try {
            setModalMode("deleting");
            await Promise.resolve(onDelete(selectedThreadToDelete));
            setModalMode("success");
            setModalMsg("Conversation has been deleted.");
            // Optionally close drawer after a short delay:
            // setTimeout(() => setIsMobileSidebarOpen(false), 400);
        } catch (e: any) {
            setModalMode("error");
            setModalMsg(e?.message || "Delete failed.");
        }
    }

    function closeModal() {
        setModalOpen(false);
        setSelectedThreadToDelete(null);
        setModalMsg(undefined);
    }

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
                            aria-busy={isBusy}
                            disabled={isBusy}
                            onClick={onNew}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            + New
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="p-2 overflow-y-auto h-[calc(100%-49px)] divide-y divide-gray-200">
                    {conversationThreads.length === 0 ? (
                        <div className="text-xs text-gray-500 px-2 py-3">
                            No conversation yet. Create one
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {conversationThreads.map((thread) => {
                                const active = thread.thread_id === activeThreadId;
                                return (
                                    <li key={thread.thread_id}>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => {
                                                onSelect(thread.thread_id);
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    onSelect(thread.thread_id);
                                                    setIsMobileSidebarOpen(false);
                                                }
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
                                            {/* Delete icon (span to avoid nested button issues) */}
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(isBusy) {
                                                        return;
                                                    } else {
                                                        openDeleteConfirm(thread.thread_id);
                                                    }
                                                }}
                                                className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                                                title="Delete conversation"
                                                aria-label="Delete conversation"
                                            >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-6 4h8" />
                        </svg>
                      </span>
                                        </div>
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

            {/* Delete modal */}
            <DeleteDocumentModal
                open={modalOpen}
                mode={modalMode}
                subjectLabel="conversation"
                name={selectedThreadToDelete || undefined}
                message={modalMsg}
                onConfirm={confirmDelete}
                onClose={closeModal}
            />
        </div>
    );
}