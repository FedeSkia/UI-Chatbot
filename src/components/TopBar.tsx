import {useNavigate} from "react-router-dom";
import {clearToken, decodeEmailFromJwt, getRefreshToken, setRefreshToken} from "../lib/auth";

export default function TopBar({setIsSidebarOpen, isSideBarOpen}: {
    setIsSidebarOpen?: (value: ((prevState: boolean) => boolean)) => void
    isSideBarOpen: boolean;
}) {

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


    return (
        <header className="w-full border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen((v) => !v)}
                    className="top-3 -right-3 z-20 rounded-full border border-gray-300 bg-white shadow px-2 py-1 text-xs hover:bg-gray-100 active:bg-gray-200"
                    aria-label={isSideBarOpen ? "Close conversations" : "Open conversations"}
                    title={isSideBarOpen ? "Close" : "Open"}
                >
                    {isSideBarOpen ? "←" : "→"}
                </button>
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
        </header>
    );
}