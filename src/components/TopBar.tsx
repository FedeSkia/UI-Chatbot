import {NavLink, useLocation, useNavigate} from "react-router-dom";
import {clearToken, decodeEmailFromJwt, getRefreshToken, setRefreshToken} from "../lib/auth";
import {useAppBusy} from "../context/AppBusyContext.tsx";

interface TopBarProps {
    onToggleMobileSidebar?: () => void
}

export default function TopBar({onToggleMobileSidebar}: TopBarProps) {

    const navigate = useNavigate();
    const location = useLocation();
    const email = decodeEmailFromJwt();
    const isDocumentsPage = location.pathname.startsWith("/documents");
    const {isBusy} = useAppBusy();

    function handleLogout() {
        clearToken?.();
        // clear refresh token if you store it
        const rt = getRefreshToken?.();
        if (rt !== undefined) {
            setRefreshToken?.("");
            // optional: clear any user info you persisted
            localStorage.removeItem("userEmail");
            navigate("/login", {replace: true});
        }
    }

    const tabClasses = ({isActive}: { isActive: boolean }) =>
        [
            "inline-flex items-center h-9 px-3 text-sm",
            "border-b-2",
            isActive
                ? "font-semibold border-blue-600 text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300",
            "transition-colors",
        ].join(" ");

    return (
        <header className="w-full border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4">
                {/* Top row: brand / toggle / user */}
                <div className="flex items-center justify-between py-3 gap-4">
                    <div className="flex items-center gap-2">
                        {/* Mobile sidebar toggle */}
                        {!isDocumentsPage && (
                            <button
                                type="button"
                                onClick={onToggleMobileSidebar}
                                className={`${isBusy ? "pointer-events-none opacity-50" : ""} md:hidden mr-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs shadow hover:bg-gray-100 active:bg-gray-200"`}
                                aria-label="Toggle sidebar"
                                title="Toggle sidebar"
                            >
                                ☰
                            </button>
                        )}
                        <div
                            className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
                            AI
                        </div>
                        <span className="text-lg font-bold text-gray-800">MyAssistant</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="max-w-[200px] truncate text-sm text-gray-600">
                            {email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="rounded-md bg-red-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-700"
                            aria-label="Logout"
                            title="Logout"
                        >
                            {/* Logout icon: door with arrow */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                            >
                                <path d="M16 17v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"/>
                                <polyline points="10 12 22 12"/>
                                <polyline points="18 8 22 12 18 16"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs row (GitHub repo style) */}
                <nav
                    aria-label="Primary"
                    className={`-mb-px flex items-center gap-2 justify-center ${isBusy ? "pointer-events-none opacity-50" : ""}`}
                >
                    <NavLink to="/chat" end className={tabClasses}>
                        {/* optional icon */}
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Chat
                    </NavLink>

                    <NavLink to="/documents" className={tabClasses}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" d="M7 3h8l4 4v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/>
                            <path strokeWidth="2" d="M15 3v4h4"/>
                        </svg>
                        Documents
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}