import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import {ChatPage} from "./pages/ChatPage";
import DocumentsPage from "./pages/DocumentsPage.tsx";
import AppLayout from "./components/AppLayout.tsx";
import {AppBusyProvider} from "./context/AppBusyContext.tsx"; // or your existing chat ui page

export default function App() {
    return (
        <AppBusyProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route element={<AppLayout/>}>
                        <Route path="/documents" element={
                            <RequireAuth>
                                <DocumentsPage/>
                            </RequireAuth>
                        }/>
                        <Route path="/" element={<Navigate to="/chat" replace/>}/>
                        <Route
                            path="/chat"
                            element={
                                <RequireAuth>
                                    <ChatPage/>
                                </RequireAuth>
                            }
                        />
                        {/* 404 */}
                        <Route path="*" element={<Navigate to="/chat" replace/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AppBusyProvider>
    );
}