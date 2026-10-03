"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Sign in failed.");
    router.push("/dashboard");
    router.refresh();
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <Link href="/" className="auth-brand">H</Link>
    <h1>Sign in</h1><p>Access your hosting control panel.</p>
    <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
    <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
    {error && <div className="auth-error">{error}</div>}
    <button disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
    <small>New here? <Link href="/register">Create an account</Link></small>
  </form></main>;
}
