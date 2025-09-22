import {type FormEvent, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {createUser, loginWithEmailPassword} from "../lib/login";

export default function LoginPage() {
    // login form state
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");

    // registration form state
    const [regEmail, setRegEmail] = useState("");
    const [regPwd, setRegPwd] = useState("");
    const [regPwdConfirm, setRegPwdConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [registrationError, setRegistrationLoginError] = useState<string | null>(null);
    const [wantToRegister, setWantToRegister] = useState<boolean>(false);

    const navigate = useNavigate();
    const location = useLocation() as any;
    const from = location.state?.from?.pathname || "/chat";

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoginError(null);
        setLoading(true);
        const res = await loginWithEmailPassword(email.trim(), pwd);
        setLoading(false);

        if (res.ok) {
            navigate(from, {replace: true});
        } else {
            setLoginError(res.error);
        }
    }

    async function handleRegistration(e: FormEvent) {
        e.preventDefault();
        setLoginError(null);
        setLoading(true);
        if (regPwd !== regPwdConfirm) {
            setLoginError("Passwords do not match.");
            return;
        }

        const res = await createUser(regEmail.trim(), regPwd);
        setLoading(false);

        if (res.ok) {
            navigate(from, {replace: true});
        } else {
            setRegistrationLoginError(res.error);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            {!wantToRegister ? (
                    <>
                        <div className="w-full max-w-md rounded-2xl border-4 border-gray-400 bg-white p-6 shadow-lg">
                            <h1 className="text-2xl font-bold">Sign in</h1><p className="mt-2 text-sm text-black">
                            Login using email and password.
                        </p>
                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none"
                                        placeholder="you@example.com"
                                        required/>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={pwd}
                                        onChange={(e) => setPwd(e.target.value)}
                                        autoComplete="current-password"
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none"
                                        placeholder="••••••••"
                                        required/>
                                </div>

                                {loginError && <div className="text-sm text-red-600 dark:text-red-400">{loginError}</div>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition"
                                >
                                    {loading ? "Logging in…" : "Log in"}
                                </button>
                                <button
                                    onClick={() => setWantToRegister(true)}
                                    disabled={loading}
                                    className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition"
                                >
                                    Or register
                                </button>
                            </form>
                        </div>
                    </>
                )
                : (
                    <>
                        <div className="w-full max-w-md rounded-2xl border-4 border-gray-400 bg-white p-6 shadow-lg">

                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <h2 className="text-xl font-bold">Register</h2>
                                <p className="mt-2 text-sm text-black">
                                    Create a new account with your email and password.
                                </p>
                                <form onSubmit={handleRegistration} className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm mb-1">Email</label>
                                        <input
                                            type="email"
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none"
                                            placeholder="you@example.com"
                                            required
                                            onChange={(e) => setRegEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Password</label>
                                        <input
                                            type="password"
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none"
                                            placeholder="••••••••"
                                            required
                                            onChange={(e) => setRegPwd(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none"
                                            placeholder="••••••••"
                                            required
                                            onChange={(e) => setRegPwdConfirm(e.target.value)}
                                        />
                                    </div>

                                    {registrationError && <div className="text-sm text-red-600 dark:text-red-400">{registrationError}</div>}

                                    <button
                                        type="submit"
                                        className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition"
                                    >
                                        Register
                                    </button>
                                    <button
                                        onClick={() => setWantToRegister(false)}
                                        className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition"
                                    >
                                        Or login
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                )}

        </div>
    )

}