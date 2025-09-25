import {getToken} from "./auth.ts";
import type {UserConversationThreadsResponse} from "./conversationMessagesResponse.ts";

const API_URL = import.meta.env.VITE_API_URL as string;
const VITE_DOCUMENT_UPLOAD_PATH = import.meta.env.VITE_DOCUMENT_UPLOAD_PATH as string;
const VITE_DOCUMENT_RETRIEVE_PATH = import.meta.env.VITE_DOCUMENT_RETRIEVE_PATH as string;
const VITE_DOCUMENT_DELETE_PATH = import.meta.env.VITE_DOCUMENT_DELETE_PATH as string;

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

export type Error = {detail: string}
export type DocumentsResult = { ok: true; data: UserDocument[] } | { ok: false; status: number; error: string };

export async function deleteUserDocument(documentId: string): Promise<DocumentsResult> {
    try {
        const pathToDeleteDocument = API_URL + VITE_DOCUMENT_DELETE_PATH + documentId;
        const res = await fetch(pathToDeleteDocument, {
            method: "DELETE",
            headers: {
                Accept: "application/docs",
                Authorization: `Bearer ${getToken() || ""}`,
            },
        });
        if (!res.ok) {
            const error: Error = await res.json();
            return { ok: false, error: error.detail, status: res.status };
        }

        const docs: UserDocument[] = await res.json().catch(() => ({}));
        return { ok: true, data: docs };
    } catch (e: any) {
        return { ok: false, error: e?.message, status: 500 };
    }
}

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
        if (!res.ok) {
            const msg: Error = await res.json();
            return { ok: false, error: msg.detail, status: res.status };
        }

        // Ensure it's an array
        const responseParsed = await res.json();
        const docs: UserDocument[] = Array.isArray(responseParsed) ? responseParsed : [];
        // Sort by newest first
        docs.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

        return { ok: true, data: docs };
    } catch (e: any) {
        return { ok: false, error: e.message, status: 500 };
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

export function orderConversationThreads(conversationThreads: UserConversationThreadsResponse | null) {
    return () => {
        if (conversationThreads) {
            return [...conversationThreads.threads].sort(
                (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
            );
        }
        return [];
    };
}
