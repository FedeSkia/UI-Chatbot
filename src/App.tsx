import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/AppLayout";
import { AppBusyProvider } from "./context/AppBusyContext";

export default function App() {
    return (
        <AppBusyProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    {/* Catch-all into a persistent layout; no Navigate redirects */}
                    <Route path="/*" element={<AppLayout />} />
                </Routes>
            </BrowserRouter>
        </AppBusyProvider>
    );
}