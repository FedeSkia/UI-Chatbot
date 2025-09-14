// src/components/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken, getRefreshToken, clearToken, clearRefreshToken } from "../lib/auth";
import { refreshToken } from "../lib/refreshToken";
import type { JSX } from "react";

type Status = "checking" | "authed" | "unauthed";

export default function RequireAuth({ children }: { children: JSX.Element }) {
    const location = useLocation();
    const [status, setStatus] = useState<Status>("checking");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const token = getToken();
            if (token) {
                if (!cancelled) setStatus("authed");
                return;
            }

            const rt = getRefreshToken();
            if (!rt) {
                if (!cancelled) setStatus("unauthed");
                return;
            }

            // Try refreshing in the background
            const res = await refreshToken();
            if (cancelled) return;

            if (res.ok) {
                setStatus("authed");
            } else {
                clearToken();
                clearRefreshToken?.();
                setStatus("unauthed");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (status === "checking") {
        return (
            <div className="min-h-[40vh] grid place-items-center text-sm text-gray-500 dark:text-gray-400">
                Checking session…
            </div>
        );
    }

    if (status === "unauthed") {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // status === "authed"
    return children;
}