import {getToken} from "./auth.ts";

const API_URL = import.meta.env.VITE_API_URL as string;
const VITE_DOCUMENT_UPLOAD_PATH = import.meta.env.VITE_DOCUMENT_UPLOAD_PATH as string;
export type IngestedApi = { chunks: number, file_name: string }
export type UploadResultApi = { filename: string, status: string, ingested: IngestedApi }
export type UploadFailedApi = { detail: string };
export type UploadResult = { ok: boolean, filename: string, error: string };

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