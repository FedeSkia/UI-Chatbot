import {NavLink, useNavigate} from "react-router-dom";
import {clearToken, decodeEmailFromJwt, getRefreshToken, setRefreshToken} from "../lib/auth";

export default function TopBar({setIsSidebarOpen, isSideBarOpen, showSideBar}: {
    setIsSidebarOpen?: (value: ((prevState: boolean) => boolean)) => void
    isSideBarOpen: boolean;
    showSideBar: boolean;
}) {

    const navigate = useNavigate();
    const email = decodeEmailFromJwt();

    const linkClasses = ({isActive}: { isActive: boolean }) =>
        [
            "px-3 py-1.5 rounded-md text-xs font-medium transition",
            isActive
                ? "bg-blue-600 text-white shadow"
                : "text-gray-700 hover:bg-gray-100"
        ].join(" ");

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


    return (
        <header className="w-full border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 gap-4">
                {/* Left: sidebar toggle + brand */}
                {showSideBar ? (<>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen?.((v) => !v)}
                            className="rounded-full border border-gray-300 bg-white shadow px-2 py-1 text-xs hover:bg-gray-100 active:bg-gray-200"
                            aria-label={isSideBarOpen ? "Close conversations" : "Open conversations"}
                            title={isSideBarOpen ? "Close" : "Open"}
                        >
                            {isSideBarOpen ? "←" : "→"}
                        </button>
                        <span className="text-sm font-semibold text-gray-800">Assistant</span>
                    </div>
                </>) : (<></>)}


                {/* Center: navigation */}
                <nav className="flex items-center gap-2" aria-label="Primary">
                    <NavLink to="/chat" className={linkClasses} end>
                        Chat
                    </NavLink>
                    <NavLink to="/documents" className={linkClasses}>
                        Documents
                    </NavLink>
                </nav>

                {/* Right: user info + logout */}
                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-700">
                        {email ? `Logged in as: ${email}` : "Not logged in"}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-700 active:bg-red-800 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}