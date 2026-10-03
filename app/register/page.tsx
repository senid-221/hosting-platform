"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await fetch("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,email,password})});
    const data = await res.json(); setLoading(false);
    if (!res.ok) return setError(data.error ?? "Registration failed.");
    router.push("/dashboard"); router.refresh();
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <Link href="/" className="auth-brand">H</Link>
    <h1>Create your account</h1><p>Start managing websites, domains and deployments.</p>
    <label>Name<input value={name} onChange={e=>setName(e.target.value)} /></label>
    <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
    <label>Password<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} /></label>
    {error && <div className="auth-error">{error}</div>}
    <button disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
    <small>Already have an account? <Link href="/login">Sign in</Link></small>
  </form></main>;
}
