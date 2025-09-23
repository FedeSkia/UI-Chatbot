import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { getUserDocuments, type UserDocument } from "../lib/documents";

export default function DocumentsPage() {
    const [docs, setDocs] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    <th className="px-4 py-2 font-medium">Name</th>
                                    <th className="px-4 py-2 font-medium">Created</th>
                                    {/* add more columns if needed */}
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((d) => (
                                    <tr key={d.document_id} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-900">{d.file_name}</td>
                                        <td className="px-4 py-2 text-gray-700">
                                            {new Date(d.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}