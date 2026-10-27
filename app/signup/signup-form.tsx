"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { roleDestinations, signUpWithPassword, type AppRole } from "@/lib/supabase/auth";

const roles: Array<{ value: AppRole; label: string; description: string }> = [
  { value: "admin", label: "Admin", description: "Manage orders and assignments" },
  { value: "technician", label: "Technician", description: "Complete assigned field jobs" },
  { value: "manager", label: "Manager", description: "Review jobs and operations" }
];

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("admin");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await signUpWithPassword({ name: name.trim(), email: email.trim(), password, role });
      if (result.needsEmailConfirmation) {
        setNotice("Account created. Check your email to confirm the account, then sign in.");
      } else {
        router.push(roleDestinations[role]);
      }
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sea">Create account</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Set up workspace access</h1>
      <p className="mt-3 leading-6 text-slate-500">This creates a Supabase Auth account and a matching role profile.</p>
      {error && <div role="alert" className="mt-6 rounded-xl bg-rose px-4 py-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="mt-6 rounded-xl bg-mint px-4 py-3 text-sm text-emerald-900">{notice}</div>}

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold text-ink">Full name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" /></label>
        <label className="block text-sm font-semibold text-ink">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" /></label>
        <label className="block text-sm font-semibold text-ink">Password<input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" /></label>
        <label className="block text-sm font-semibold text-ink">Workspace role<select value={role} onChange={(event) => setRole(event.target.value as AppRole)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-blue-100">{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <p className="text-sm text-slate-500">{roles.find((item) => item.value === role)?.description}</p>
        <button disabled={busy} className="w-full rounded-xl bg-ink px-4 py-3.5 font-semibold text-white disabled:cursor-wait disabled:opacity-60">{busy ? "Creating account..." : "Create account"}</button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-sea hover:underline">Sign in</Link></div>
    </div>
  );
}
