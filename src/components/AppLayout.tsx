import { Outlet } from "react-router-dom";
import { useState } from "react";
import TopBar from "./TopBar";

export type LayoutOutletCtx = {
    isMobileSidebarOpen: boolean;
    setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAppBusy: (busy: boolean) => void;
};

export default function AppLayout() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isAppBusy, setIsAppBusy] = useState(false); // 👈 lifted busy state

    function toggleMobileSidebar() {
        setIsMobileSidebarOpen((v) => !v);
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <TopBar onToggleMobileSidebar={toggleMobileSidebar} isAppBusy={isAppBusy} /> {/* 👈 pass busy */}
            <div className="flex-1">
                <div className="w-full px-2 sm:px-4 py-4">
                    <div className="flex gap-4 h-full min-h-0">
                        <div className="min-w-0 flex-1">
                            <Outlet context={{
                                isMobileSidebarOpen,
                                setIsMobileSidebarOpen,
                                isAppBusy: setIsAppBusy
                            } satisfies LayoutOutletCtx} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}