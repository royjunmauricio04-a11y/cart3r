"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", { email: String(form.get("email")), password: String(form.get("password")), redirect: false, callbackUrl: "/" });
      if (result?.error) setError("Sign-in failed. Check your email and password, then try again.");
      else window.location.assign(result?.url || "/");
    } catch { setError("Unable to sign in. Check the server and database configuration, then try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><aside className="auth-aside"><a className="brand" href="/"><span className="brand-mark"><span /></span><span className="brand-word">CART3R<span className="brand-dot">.</span><small>TIKTOK BOOST</small></span></a><div className="auth-pitch"><span className="eyebrow">YOUR CAMPAIGN WORKSPACE</span><h1>Make every promotion count.</h1><p>Organize your video links and campaigns. See analytics only when an authorized source provides them.</p><span className="auth-tagline">NO BOTS. NO FAKE ENGAGEMENT.</span></div><span className="sidebar-foot">CART3R · Authentic promotion tools</span></aside><section className="auth-main"><div className="auth-card"><span className="eyebrow">ACCOUNT ACCESS</span><h2>Sign in to CART3R</h2><p>Access your saved campaigns, videos and reporting workspace.</p>{error && <div className="auth-error" role="alert">{error}</div>}<form className="auth-form" onSubmit={submit}><label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="button button-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in →"}</button></form><div className="auth-switch">New to CART3R? <a href="/register">Create an account</a></div><a className="auth-home" href="/">← Back to dashboard</a></div></section></main>;
}
