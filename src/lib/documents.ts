import {getToken} from "./auth.ts";

const API_URL = import.meta.env.VITE_API_URL as string;
const VITE_DOCUMENT_UPLOAD_PATH = import.meta.env.VITE_DOCUMENT_UPLOAD_PATH as string;
const VITE_DOCUMENT_RETRIEVE_PATH = import.meta.env.VITE_DOCUMENT_RETRIEVE_PATH as string;

export type IngestedApi = { chunks: number, file_name: string }
export type UploadResultApi = { filename: string, status: string, ingested: IngestedApi }
export type UploadFailedApi = { detail: string };
export type UploadResult = { ok: boolean, filename: string, error: string };


export type UserDocument = {
    file_name: string;
    user_id: string;
    document_id: string;
    created_at: string; // ISO-8601
};

export type DocumentsResult =
    | { ok: true; data: UserDocument[] }
    | { ok: false; error: string; status?: number };

export async function getUserDocuments(): Promise<DocumentsResult> {
    try {
        const pathToRetrieveDocuments = API_URL + VITE_DOCUMENT_RETRIEVE_PATH;
        const res = await fetch(pathToRetrieveDocuments, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${getToken() || ""}`,
            },
        });

        // Attempt to parse JSON either way
        const json = await res.json().catch(() => ([]));

        if (!res.ok) {
            const msg = (json && (json.msg || json.message || json.error)) || res.statusText || "Failed to fetch documents";
            return { ok: false, error: msg, status: res.status };
        }

        // Ensure it's an array
        const docs: UserDocument[] = Array.isArray(json) ? json : [];
        // Sort by newest first
        docs.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

        return { ok: true, data: docs };
    } catch (e: any) {
        return { ok: false, error: e?.message || "Network error" };
    }
}

export async function uploadDocument(file: File): Promise<UploadResult> {
    try {
        const fd = new FormData();
        fd.append("file", file, file.name); // field name must be "file" to match the backend
        const pathToUploadDocument = API_URL + VITE_DOCUMENT_UPLOAD_PATH;

        const res = await fetch(pathToUploadDocument, {
            method: "POST",
            headers: {
                // IMPORTANT: don't set Content-Type manually; browser will add the boundary
                Authorization: `Bearer ${getToken() || ""}`,
                Accept: "application/json",
            },
            body: fd,
        });

        // try to parse JSON either way


        if (!res.ok) {
            const data: UploadFailedApi = await res.json();
            const msg = "Upload failed because: " + data.detail;
            return {ok: false, error: msg, filename: file.name};
        }

        const data: UploadResultApi = await res.json();
        return {ok: true, filename: data.filename, error: ""};
    } catch (e: any) {
        return {filename: file.name, ok: false, error: e?.message || "Network error"};
    }
}