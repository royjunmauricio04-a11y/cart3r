"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || ""); const password = String(form.get("password") || "");
    if (password !== String(form.get("confirmPassword") || "")) { setError("Your passwords don’t match."); setBusy(false); return; }
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error === "Too many requests" ? "Too many attempts. Wait a minute and try again." : data.error === "Invalid input" ? "Enter a valid email and a password with at least 10 characters." : "We couldn’t create the account. It may already exist, or the database may be unavailable."); return; }
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/" });
      if (result?.error) { window.location.assign("/login"); return; }
      window.location.assign(result?.url || "/");
    } catch { setError("Unable to register. Check the server and database configuration, then try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><aside className="auth-aside"><a className="brand" href="/"><span className="brand-mark"><span /></span><span className="brand-word">CART3R<span className="brand-dot">.</span><small>TIKTOK BOOST</small></span></a><div className="auth-pitch"><span className="eyebrow">BUILT FOR CREATORS</span><h1>Build a better campaign rhythm.</h1><p>Keep your TikTok promotions organized. Your analytics stay honest and your account data stays yours.</p><span className="auth-tagline">ORGANIZE. PREPARE. PROMOTE.</span></div><span className="sidebar-foot">CART3R · Authentic promotion tools</span></aside><section className="auth-main"><div className="auth-card"><span className="eyebrow">NEW ACCOUNT</span><h2>Create your workspace</h2><p>Use an email address and a password of at least 10 characters.</p>{error && <div className="auth-error" role="alert">{error}</div>}<form className="auth-form" onSubmit={submit}><label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></label><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></label><button className="button button-primary" disabled={busy}>{busy ? "Creating account…" : "Create account →"}</button></form><div className="auth-switch">Already have an account? <a href="/login">Sign in</a></div><a className="auth-home" href="/">← Back to dashboard</a></div></section></main>;
}
