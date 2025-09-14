import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage"; // or your existing chat ui page

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/chat"
                    element={
                        <RequireAuth>
                            <ChatPage />
                        </RequireAuth>
                    }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
        </BrowserRouter>
    );
}