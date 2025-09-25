import { Outlet } from "react-router-dom";
import { useState } from "react";
import TopBar from "./TopBar";

export default function AppLayout() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    function toggleMobileSidebar() {
        setIsMobileSidebarOpen((v) => !v);
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <TopBar onToggleMobileSidebar={toggleMobileSidebar}/>
            <div className="flex-1">
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex gap-4">
                        {/* Let Chat page render its own Sidebar when showSidebar is true */}
                        <div className="min-w-0 flex-1">
                            <Outlet context={{ isMobileSidebarOpen, setIsMobileSidebarOpen }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}