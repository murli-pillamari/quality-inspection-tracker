import { useEffect, useState } from "react";
import { request } from "../utils/common";

const AUTH_USER_KEY = "quality_tracker_authenticated_user";

export default function AuthGate({ children }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    request("/api/auth/session")
      .then((response) => setSession(response.data))
      .catch(() => {
        const cachedUser = localStorage.getItem(AUTH_USER_KEY);
        if (cachedUser) setSession({ username: cachedUser });
      })
      .finally(() => setIsChecking(false));
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setIsSubmitting(true); setError("");
    try {
      const response = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem(AUTH_USER_KEY, response.data.username);
      setSession(response.data);
    } catch (loginError) { setError(loginError.message); } finally { setIsSubmitting(false); }
  }

  async function handleLogout() {
    await request("/api/auth/logout", { method: "POST" });
    localStorage.removeItem(AUTH_USER_KEY);
    setSession(null);
  }

  if (isChecking) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">Checking session…</main>;
  if (session) return <>{children({ username: session.username, onLogout: handleLogout })}</>;

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950"><form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Arvind Limited</p><h1 className="mt-1 text-2xl font-bold">Quality Tracker</h1><p className="mt-2 text-sm text-slate-500">Sign in to manage inspections.</p>{error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<label className="mt-5 block text-sm font-semibold text-slate-700">Username<input value={username} onChange={(event) => setUsername(event.target.value)} className="input mt-1" autoComplete="username" required /></label><label className="mt-4 block text-sm font-semibold text-slate-700">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="input mt-1" autoComplete="current-password" required /></label><button disabled={isSubmitting} className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? "Signing in…" : "Sign in"}</button></form></main>;
}