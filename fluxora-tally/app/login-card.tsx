"use client";
import { FormEvent, useState } from "react";
export default function LoginCard({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [working, setWorking] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setError("");
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Access denied.");
      location.replace("/");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Access denied."); setPassword(""); setWorking(false); }
  }
  return <main className="signin-page"><section className="signin-card" aria-labelledby="password-title"><img className="signin-logo" src="/favicon.png" alt="" /><p className="eyebrow">Private dashboard</p><h1 id="password-title">Fluxora Tally</h1>{configured ? <><p className="signin-copy">Enter the shared password. This browser stays signed in for seven days.</p><form className="password-form" onSubmit={submit}><label className="form-field"><span>Password</span><input autoFocus required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error ? <p className="login-error" role="alert">{error}</p> : null}<button className="button button-primary" disabled={working}>{working ? "Checking…" : "Open dashboard"}</button></form></> : <div className="setup-notice" role="status"><strong>Vercel setup required</strong><p>Add SITE_PASSWORD, SESSION_SECRET, and SUPABASE_SECRET_KEY in the project Environment Variables, then redeploy.</p></div>}</section></main>;
}
