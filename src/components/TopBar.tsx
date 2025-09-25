import {NavLink, useNavigate} from "react-router-dom";
import {clearToken, decodeEmailFromJwt, getRefreshToken, setRefreshToken} from "../lib/auth";

export default function TopBar() {

    const navigate = useNavigate();
    const email = decodeEmailFromJwt();
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

    const tabClasses = ({ isActive }: { isActive: boolean }) =>
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

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-sm text-gray-700">
                            {email ? `Logged in as: ${email}` : "Logged in"}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-700 active:bg-red-800 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs row (GitHub repo style) */}
                <nav aria-label="Primary" className="-mb-px flex items-center gap-2">
                    <NavLink to="/chat" end className={tabClasses}>
                        {/* optional icon */}
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        Chat
                    </NavLink>

                    <NavLink to="/documents" className={tabClasses}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" d="M7 3h8l4 4v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                            <path strokeWidth="2" d="M15 3v4h4" />
                        </svg>
                        Documents
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}