"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { roleDestinations, roleLabel, signInWithPassword } from "@/lib/supabase/auth";

const demoRoles = [
  { name: "Admin", destination: "/admin/orders", description: "Manage orders and assignments" },
  { name: "Technician", destination: "/technician/jobs", description: "Complete assigned field jobs" },
  { name: "Manager", destination: "/manager/reviews", description: "Review jobs and operations" }
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoRole, setDemoRole] = useState("Admin");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const profile = await signInWithPassword(email.trim(), password);
      router.push(roleDestinations[profile.role]);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  function continueDemo() {
    const selected = demoRoles.find((item) => item.name === demoRole);
    if (typeof window !== "undefined") window.sessionStorage.setItem("sejuksejuk.demo.role", demoRole.toLowerCase());
    router.push(selected?.destination ?? "/admin/orders");
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sea">Workspace sign in</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Enter your workspace</h1>
      <p className="mt-3 leading-6 text-slate-500">Use your Supabase account to continue. For assessment review, demo access remains available below.</p>

      {error && <div role="alert" className="mt-6 rounded-xl bg-rose px-4 py-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="mt-6 rounded-xl bg-mint px-4 py-3 text-sm text-emerald-900">{notice}</div>}

      <form onSubmit={signIn} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold text-ink">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="you@company.com" /></label>
        <label className="block text-sm font-semibold text-ink">Password<input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="••••••••" /></label>
        <button disabled={busy} className="w-full rounded-xl bg-ink px-4 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{busy ? "Signing in..." : "Sign in"}</button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">Need an account? <Link href="/signup" className="font-semibold text-sea hover:underline">Create one</Link></div>

      <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" />or demo access<span className="h-px flex-1 bg-slate-200" /></div>
      <label className="block text-sm font-semibold text-ink">Preview as<select value={demoRole} onChange={(event) => setDemoRole(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none focus:border-sea focus:ring-2">{demoRoles.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
      <p className="mt-3 text-sm text-slate-500">{demoRoles.find((item) => item.name === demoRole)?.description}</p>
      <button onClick={continueDemo} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3.5 font-semibold text-ink transition hover:bg-slate-50">Continue in demo mode</button>
    </div>
  );
}
