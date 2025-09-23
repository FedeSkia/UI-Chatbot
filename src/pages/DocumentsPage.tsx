import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import {deleteUserDocument, getUserDocuments, type UserDocument} from "../lib/documents";
import DeleteDocumentModal from "../components/DeleteDocumentModal.tsx";

export default function DocumentsPage() {
    const [docs, setDocs] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"confirm" | "deleting" | "success" | "error">("confirm");
    const [modalMsg, setModalMsg] = useState<string | undefined>(undefined);
    const [selected, setSelected] = useState<{ id: string; fileName?: string } | null>(null);


    function openDeleteConfirm(id: string, fileName?: string) {
        setSelected({ id, fileName });
        setModalMsg(undefined);
        setModalMode("confirm");
        setModalOpen(true);
    }

    async function confirmDelete() {
        if (!selected) return;
        setModalMode("deleting");
        const res = await deleteUserDocument(selected.id);
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


    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            const res = await getUserDocuments();
            setLoading(false);

            if (!res.ok) {
                // if token invalid/expired, go to login
                if (res.status === 401 || res.status === 403) {
                    navigate("/login", { replace: true });
                    return;
                }
                setError(res.error);
                return;
            }

            setDocs(res.data);
        })();
    }, [navigate]);

    const rows = useMemo(() => docs, [docs]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <TopBar />
            <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <h1 className="text-sm font-semibold">My Documents</h1>
                        {/* optional refresh */}
                        <button
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                getUserDocuments().then((res) => {
                                    setLoading(false);
                                    if (!res.ok) {
                                        if (res.status === 401 || res.status === 403) {
                                            navigate("/login", { replace: true });
                                            return;
                                        }
                                        setError(res.error);
                                    } else {
                                        setDocs(res.data);
                                    }
                                });
                            }}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
                        >
                            Refresh
                        </button>
                    </div>

                    {/* states */}
                    {loading && (
                        <div className="p-6 text-sm text-gray-600 flex items-center gap-2">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                            Loading documents…
                        </div>
                    )}

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
                        </div>
                    )}
                </div>
            </main>
            <DeleteDocumentModal
                open={modalOpen}
                mode={modalMode}
                fileName={selected?.fileName}
                message={modalMsg}
                onConfirm={confirmDelete}
                onClose={closeModal}
            />
        </div>
    );
}