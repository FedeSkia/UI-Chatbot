// components/UploadButton.tsx
import { useRef, useState } from "react";
import BlockingUploadModal from "./BlockingUploadModal";
import {uploadDocument} from "../lib/documents.ts";

export default function UploadButton() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [status, setStatus] = useState<"uploading" | "success" | "error">("uploading");
    const [msg, setMsg] = useState<string | undefined>(undefined);

    function pickFile() {
        inputRef.current?.click();
    }

    async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // open modal in uploading state
        setMsg(undefined);
        setStatus("uploading");
        setModalOpen(true);

        const res = await uploadDocument(file);

        if (res.ok) {
            setStatus("success");
            setMsg("Your document has been uploaded.");
            // TODO: refresh your documents list here if needed
        } else {
            setStatus("error");
            setMsg(res.error);
        }

        // reset the file input so the same file can be selected again later
        e.target.value = "";
    }

    function closeModal() {
        setModalOpen(false);
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={onFileChange}
            />
            <button
                type="button"
                onClick={pickFile}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 active:bg-blue-800"
            >
                Upload Document
            </button>

            <BlockingUploadModal open={modalOpen} status={status} message={msg} onClose={closeModal} />
        </>
    );
}