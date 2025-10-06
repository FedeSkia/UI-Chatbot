import DOMPurify from "dompurify";

export default function MsgBox({ html }: { html: string }) {
    // sanitize to avoid XSS
    const safe = DOMPurify.sanitize(html);

    return (
        <div
            className={[
                // container look
                "rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm",
                "px-3 py-2",
                // nice typography (Tailwind Typography plugin optional)
                "prose prose-sm sm:prose base:prose-neutral max-w-none",
                // make code and pre scroll nicely
                "[&>pre]:overflow-x-auto [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:bg-gray-900 [&>pre]:text-gray-100",
                // images/iframes fit
                "[&_*]:max-w-full [&_img]:rounded-md",
                // links
                "[&_a]:text-blue-600 hover:[&_a]:underline",
                // lists spacing
                "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
            ].join(" ")}
            dangerouslySetInnerHTML={{ __html: safe }}
        />
    );
}