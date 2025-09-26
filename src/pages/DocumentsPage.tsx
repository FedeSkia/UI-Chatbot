import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {deleteUserDocument, type DocumentsResult, getUserDocuments, type UserDocument} from "../lib/documents";
import DeleteDocumentModal from "../components/DeleteDocumentModal.tsx";
import UploadButton from "../components/UploadButton.tsx";

export default function DocumentsPage() {
    const [docs, setDocs] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"confirm" | "deleting" | "success" | "error" | "Not found">("confirm");
    const [modalMsg, setModalMsg] = useState<string | undefined>(undefined);
    const [selected, setSelected] = useState<{ id: string; fileName?: string } | null>(null);

    function openDeleteConfirm(id: string, fileName?: string) {
        setSelected({id, fileName});
        setModalMsg(undefined);
        setModalMode("confirm");
        setModalOpen(true);
    }

    async function confirmDelete() {
        if (!selected) return;
        setModalMode("deleting");
        const res = await deleteUserDocument(selected.id);
        if (!res.ok && res.status === 404) {
            setModalMode("Not found");
            setModalMsg(res.error);
            return;
        }
        if (!res.ok && (res.status === 401 || res.status === 403)) {
            navigate("/login", {replace: true});
            return;
        }
        if (!res.ok) {
            setModalMode("error");
            setModalMsg(res.error);
            return;
        }
        // success: update table
        setDocs((prev) => prev.filter((d) => d.document_id !== selected.id));
        setModalMode("success");
        setModalMsg(`“${selected.fileName || selected.id}” has been deleted.`);
    }

    function closeModal() {
        setModalOpen(false);
        setSelected(null);
        setModalMsg(undefined);
    }

    async function retrieveDocuments() {
        setLoading(true);
        setError(null);

        const res: DocumentsResult = await getUserDocuments();

        if (res.ok) {
            setDocs(res.data);
            setLoading(false);
            return;
        }

        if (res.status === 404) {
            setDocs([]);
            setError("No documents found");
            setLoading(false);
            return;
        }

        if (res.status === 401 || res.status === 403) {
            navigate("/login", { replace: true });
            return;
        }

        setDocs([]);
        setError(res.error || "No documents found");
        setLoading(false);
    }

    useEffect(() => {
        retrieveDocuments();
    }, [navigate]);

    const rows = useMemo(() => docs, [docs]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <h1 className="text-sm font-semibold">My Documents</h1>
                        {/* optional refresh */}
                        <button
                            onClick={retrieveDocuments}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
                        >
                            Refresh
                        </button>
                        <UploadButton
                            getUserDocuments={getUserDocuments}
                            setDocs={setDocs}
                        />
                    </div>

                    {/* states */}
                    {!loading && error && (
                        <div className="p-6 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {!loading && !error && rows.length === 0 && (
                        <div className="p-6 text-sm text-gray-500">
                            No documents yet. Upload one to get started.
                        </div>
                    )}

                    {!loading && !error && rows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-gray-600">
                                        <th className="px-4 py-2 font-medium">Name</th>
                                        <th className="px-4 py-2 font-medium">Created</th>
                                        <th className="px-4 py-2 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((d) => (
                                        <tr key={d.document_id} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-2 text-gray-900">{d.file_name}</td>
                                            <td className="px-4 py-2 text-gray-700">{new Date(d.created_at).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    onClick={() => openDeleteConfirm(d.document_id, d.file_name)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
            <DeleteDocumentModal
                open={modalOpen}
                mode={modalMode}
                name={selected?.fileName}
                message={modalMsg}
                onConfirm={confirmDelete}
                onClose={closeModal}
                subjectLabel={"document"}
            />
        </div>
    );
}