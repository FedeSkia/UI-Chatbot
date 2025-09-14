import {getRefreshToken, setRefreshToken, setToken} from "./auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function refreshToken(): Promise<LoginResult> {
    try {
        const gotrue = import.meta.env.VITE_AUTH_URL as string;
        const res = await fetch(`${gotrue}/token?grant_type=refresh_token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"refresh_token": getRefreshToken()}),
        });
        const data = await res.json();
        if (!res.ok) {
            const msg = data?.error_description || data?.msg || data?.message || res.statusText;
            return {ok: false, error: msg || "Cant refresh token."};
        }

        const accessToken = data?.access_token as string | undefined;
        const refreshToken = data?.refresh_token as string | undefined;

        if (!accessToken || !refreshToken) return {ok: false, error: "refresh token error"};
        setToken(accessToken);
        setRefreshToken(refreshToken);
        return {ok: true};


    } catch (e: any) {
        return {ok: false, error: e?.message || "Errore di rete."};
    }
}