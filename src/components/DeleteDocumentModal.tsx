import { useEffect } from "react";

export type Mode = "confirm" | "deleting" | "success" | "error" | "Not found";

export default function DeleteDocumentModal({
                                                open,
                                                mode,
                                                name,
                                                message,
                                                subjectLabel = "document",
                                                onConfirm,
                                                onClose,
                                            }: {
    open: boolean;
    mode: Mode;
    name?: string;
    message: string;
    subjectLabel: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    if (!open) return null;

    // Capitalize subject for headings
    const Subject = subjectLabel.charAt(0).toUpperCase() + subjectLabel.slice(1);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
                {mode === "confirm" && (
                    <div className="text-center">
                        <h2 className="text-base font-semibold">Delete {subjectLabel}?</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {name ? `You are about to delete “${name}”.` : "This action cannot be undone."}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <button
                                onClick={onClose}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {mode === "deleting" && (
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                        <h2 className="text-base font-semibold">Deleting…</h2>
                        <p className="mt-1 text-sm text-gray-600">Please wait.</p>
                    </div>
                )}

                {mode === "success" && (
                    <div className="text-center">
                        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-green-100 grid place-items-center">
                            <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600" fill="none" stroke="currentColor">
                                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-base font-semibold">{Subject} deleted</h2>
                        {message && <p className="mt-1 text-sm text-gray-600">{message}</p>}
                        <button
                            onClick={onClose}
                            className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                )}

                {mode === "error" && (
                    <div className="text-center">
                        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-red-100 grid place-items-center">
                            <svg viewBox="0 0 24 24" className="h-6 w-6 text-red-600" fill="none" stroke="currentColor">
                                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                            </svg>
                        </div>
                        <h2 className="text-base font-semibold">Delete failed</h2>
                        <p className="mt-1 text-sm text-red-600">{message || "Something went wrong."}</p>
                        <button
                            onClick={onClose}
                            className="mt-4 inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}