export const TOKEN_KEY = "jwt";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const userEmail = "userEmail";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function setRefreshToken(refreshToken: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function clearRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

export function getUserEmail(): string | null {
    return localStorage.getItem(userEmail); // or decode from JWT
}

export function decodeEmailFromJwt(): string | null {
    const token = getToken();
    if (!token) return null;
    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        // common locations for email claim
        return json?.email || json?.user_metadata?.email || null;
    } catch {
        return null;
    }
}