import {setRefreshToken, setToken} from "./auth";
const gotrue = import.meta.env.VITE_AUTH_URL as string;
const refreshTokenPath = import.meta.env.VITE_REFRESH_TOKEN_PATH as string;
const registrationPath = import.meta.env.VITE_AUTH_REGISTRATION_PATH as string;

export type LoginResult = { ok: true } | { ok: false; error: string };

export type AuthResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
    refresh_token: string;
    user: User;
};

export type User = {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    phone: string;
    last_sign_in_at: string;
    app_metadata: {
        provider: string;
        providers: string[];
    };
    user_metadata: {
        email: string;
        email_verified: boolean;
        phone_verified: boolean;
        sub: string;
    };
    identities: Identity[];
    created_at: string;
    updated_at: string;
    is_anonymous: boolean;
};

export type Identity = {
    identity_id: string;
    id: string;
    user_id: string;
    identity_data: {
        email: string;
        email_verified: boolean;
        phone_verified: boolean;
        sub: string;
    };
    provider: string;
    last_sign_in_at: string;
    created_at: string;
    updated_at: string;
    email: string;
};

export type GoTrueApiError = {
    code: number;
    error_code: string;
    msg: string;
};


export type RegistrationResult = { ok: true } | { ok: false; error: string };

export async function loginWithEmailPassword(email: string, password: string): Promise<LoginResult> {
    try {
        if (!email || !password) return {ok: false, error: "Email and password are mandatory."};

        const pathToRefreshTokenApi = gotrue + refreshTokenPath;
        const res = await fetch(`${pathToRefreshTokenApi}?grant_type=password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password}),
        });

        const data = await res.json();
        if (!res.ok) {
            const msg = data?.error_description || data?.msg || data?.message || res.statusText;
            return {ok: false, error: msg || "Login failed."};
        }

        const accessToken = data?.access_token as string | undefined;
        const refreshToken = data?.refresh_token as string | undefined;

        if (!accessToken || !refreshToken) return {ok: false, error: "Login error"};
        setToken(accessToken);
        setRefreshToken(refreshToken);
        return {ok: true};


    } catch (e: any) {
        return {ok: false, error: e?.message};
    }
}


export async function createUser(email: string, password: string): Promise<RegistrationResult> {
    if (!email || !password) return {ok: false, error: "Email and password are mandatory."};
    const pathToRegisterApi = gotrue + registrationPath;
    const res = await fetch(`${pathToRegisterApi}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email, password}),
    });
    if (!res.ok) {
        const data: GoTrueApiError = await res.json();
        return {ok: false, error: data.msg};
    }
    const data: AuthResponse = await res.json();
    //TODO This only works in DEV. In prod the user must use the confirmation email
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return {ok: true};
}
