import {useLocation} from "react-router-dom";
import TopBar from "./TopBar";
import DocumentsPage from "../pages/DocumentsPage";
import {ChatPage} from "../pages/ChatPage.tsx";
import {useState} from "react";

export default function AppLayout() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    function toggleMobileSidebar() {
        setIsMobileSidebarOpen((v) => !v);
    }

    const { pathname } = useLocation();

    let content: React.ReactNode;
    if (pathname.startsWith("/documents")) content = <DocumentsPage />;
    else if (pathname.startsWith("/chat") || pathname === "/") content = <ChatPage isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen} />;
    else content = <ChatPage isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen}/>; // fallback instead of Navigate

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <TopBar onToggleMobileSidebar={toggleMobileSidebar} />
            <main className="flex-1 overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 py-4 h-full">
                        {content}
                </div>
            </main>
        </div>
    );
}