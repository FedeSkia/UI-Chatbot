import {type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithEmailPassword } from "../lib/login";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation() as any;
    const from = location.state?.from?.pathname || "/chat";

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await loginWithEmailPassword(email.trim(), pwd);
        setLoading(false);

        if (res.ok) {
            navigate(from, { replace: true });
        } else {
            setError(res.error);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0d10]">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Sign in</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Accedi con email e password.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-transparent px-3 py-2 text-sm focus:outline-none"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            type="password"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-transparent px-3 py-2 text-sm focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition"
                    >
                        {loading ? "Accesso in corso…" : "Accedi"}
                    </button>
                </form>

                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Provider: {import.meta.env.VITE_AUTH_PROVIDER || "custom"}
                </p>
            </div>
        </div>
    );
}