"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { roleDestinations, signUpWithPassword, type AppRole } from "@/lib/supabase/auth";
import { clearDemo, useSession } from "@/lib/session";
import { Button, ErrorBanner } from "@/components/ui/primitives";

const roles: Array<{ value: AppRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "technician", label: "Technician" },
  { value: "manager", label: "Manager" }
];

export function SignupForm() {
  const router = useRouter();
  const session = useSession();
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
      clearDemo();
      const result = await signUpWithPassword({ name: name.trim(), email: email.trim(), password, role });
      if (result.needsEmailConfirmation) {
        setNotice("Account created. Check your email to confirm it, then sign in.");
        setBusy(false);
      } else {
        await session.refresh();
        router.push(roleDestinations[role]);
      }
    } catch (signUpError) {
      const message = signUpError instanceof Error ? signUpError.message : "Could not create the account.";
      setError(/rate limit/i.test(message) ? "Too many sign-up emails this hour. Use “Continue as” on the sign-in page instead." : message);
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-5">
      <div>
        <h2 className="text-4xl font-extralight tracking-tight text-ink">Create account</h2>
        <p className="mt-2 text-[15px] font-light text-ink-muted">Creates a Supabase Auth account with a role profile.</p>
      </div>
      {error && <ErrorBanner message={error} />}
      {notice && <p role="status" className="rounded-xl bg-ok-tint px-4 py-3 text-[13px] font-medium text-ok">{notice}</p>}
      <form onSubmit={submit} className="space-y-3.5">
        <label className="label">Full name<input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field-input h-11" /></label>
        <label className="label">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input h-11" /></label>
        <label className="label">Password<input required type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="field-input h-11" /><span className="hint">At least 6 characters</span></label>
        <label className="label">Role<select value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="field-input h-11">{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <Button type="submit" variant="primary" size="lg" className="h-[52px] w-full text-[15px]" loading={busy}>Create account</Button>
      </form>
      <p className="text-center text-[13px] text-ink-muted">Already have an account? <Link href="/login" className="font-semibold text-ink hover:underline">Sign in</Link></p>
    </div>
  );
}
