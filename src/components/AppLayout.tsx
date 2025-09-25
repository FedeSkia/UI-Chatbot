import { Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import TopBar from "./TopBar";

export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const showSidebar = useMemo(() => location.pathname.startsWith("/chat"), [location.pathname]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <TopBar showSideBar={showSidebar} isSideBarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1">
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex gap-4">
                        {/* Let Chat page render its own Sidebar when showSidebar is true */}
                        <div className="min-w-0 flex-1">
                            <Outlet context={{ isSidebarOpen, setIsSidebarOpen, showSidebar }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}