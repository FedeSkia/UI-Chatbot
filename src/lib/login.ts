import {setRefreshToken, setToken} from "./auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginWithEmailPassword(email: string, password: string): Promise<LoginResult> {
    try {
        if (!email || !password) return {ok: false, error: "Email e password sono obbligatorie."};

        const gotrue = import.meta.env.VITE_AUTH_URL as string;
        if (!gotrue) return {ok: false, error: "Config Supabase mancante (GOTRUE_URL/ANON_KEY)."};

        const res = await fetch(`${gotrue}/token?grant_type=password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password}),
        });

        const data = await res.json();
        if (!res.ok) {
            const msg = data?.error_description || data?.msg || data?.message || res.statusText;
            return {ok: false, error: msg || "Login fallito (Supabase)."};
        }

        const accessToken = data?.access_token as string | undefined;
        const refreshToken = data?.refresh_token as string | undefined;

        if (!accessToken || !refreshToken) return {ok: false, error: "Login error"};
        setToken(accessToken);
        setRefreshToken(refreshToken);
        return {ok: true};


    } catch (e: any) {
        return {ok: false, error: e?.message || "Errore di rete."};
    }
}