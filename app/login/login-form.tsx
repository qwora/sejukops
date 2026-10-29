"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ChevronDown, ClipboardList, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { roleDestinations, signInWithPassword, type AppRole } from "@/lib/supabase/auth";
import { clearDemo, startDemo, useSession } from "@/lib/session";
import { technicianOptions } from "@/lib/order-types";
import { Button, cx, ErrorBanner } from "@/components/ui/primitives";

const ROLES: Array<{ role: AppRole; name: string; desc: string; icon: React.ReactNode; tint: string }> = [
  { role: "admin", name: "Admin", desc: "Create orders and assign technicians", icon: <ClipboardList className="h-5 w-5" />, tint: "bg-navy text-white" },
  { role: "technician", name: "Technician", desc: "See today’s jobs and complete service", icon: <Wrench className="h-5 w-5" />, tint: "bg-brand-tint text-brand" },
  { role: "manager", name: "Manager", desc: "Review jobs, performance and ask AI", icon: <BarChart3 className="h-5 w-5" />, tint: "bg-rail text-navy" }
];

export function LoginForm() {
  const router = useRouter();
  const session = useSession();
  const [role, setRole] = useState<AppRole>("admin");
  const [technician, setTechnician] = useState("Ali");
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"" | "role" | "email">("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setConfirmed(params.has("confirmed"));
    setLoggedOut(params.has("loggedout"));
  }, []);

  async function continueAs() {
    setBusy("role");
    setError("");
    try {
      await supabase.auth.signOut().catch(() => undefined);
      clearDemo();
      // Reviewer accounts (real Supabase Auth) when configured; the Ali account is the technician reviewer.
      const useAccount = role !== "technician" || technician === "Ali";
      if (useAccount) {
        const response = await fetch("/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
        const tokens = (await response.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string };
        if (response.ok && tokens.access_token && tokens.refresh_token) {
          await supabase.auth.setSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
          await session.refresh();
          router.push(roleDestinations[role]);
          return;
        }
      }
      startDemo(role, role === "technician" ? technician : undefined);
      await session.refresh();
      router.push(roleDestinations[role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the workspace.");
      setBusy("");
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy("email");
    setError("");
    try {
      clearDemo();
      const profile = await signInWithPassword(email.trim(), password);
      await session.refresh();
      router.push(roleDestinations[profile.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy("");
    }
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-5">
      <div>
        <h2 className="text-4xl font-extralight tracking-tight text-ink">Sign in</h2>
        <p className="mt-2 text-[15px] font-light text-ink-muted">Choose your role to continue. No password needed for the assessment demo.</p>
      </div>

      {loggedOut && !confirmed && <p className="rounded-xl bg-ok-tint px-4 py-3 text-[13px] font-medium text-ok">You have logged out.</p>}
      {confirmed && <p className="rounded-xl bg-ok-tint px-4 py-3 text-[13px] font-medium text-ok">Email confirmed. You can sign in now.</p>}
      {error && <ErrorBanner message={error} />}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="sr-only">Role</legend>
        {ROLES.map((item) => {
          const selected = role === item.role;
          return (
            <label
              key={item.role}
              className={cx(
                "flex cursor-pointer items-center gap-3.5 rounded-3xl border bg-white px-4 py-3.5 transition",
                selected ? "border-brand shadow-[0_0_0_1px_#2E7BAA]" : "border-line-strong hover:border-ink-faint"
              )}
            >
              <input type="radio" name="role" value={item.role} checked={selected} onChange={() => setRole(item.role)} className="sr-only" />
              <span className={cx("flex h-11 w-11 flex-none items-center justify-center rounded-[14px]", item.tint)} aria-hidden>{item.icon}</span>
              <span className="flex-1">
                <span className="block text-[15px] font-medium text-ink">{item.name}</span>
                <span className="mt-0.5 block text-[13px] font-light text-ink-muted">{item.desc}</span>
              </span>
              <span className={cx("h-[18px] w-[18px] flex-none rounded-full", selected ? "border-[5px] border-brand" : "border-[1.5px] border-line-input")} aria-hidden />
            </label>
          );
        })}
      </fieldset>

      {role === "technician" && (
        <label className="label animate-fade-up">
          Technician
          <select value={technician} onChange={(e) => setTechnician(e.target.value)} className="field-input h-11">
            {technicianOptions.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      )}

      <Button variant="primary" size="lg" className="h-[52px] text-[15px]" loading={busy === "role"} onClick={continueAs}>
        Continue as {role}
      </Button>

      <div className="border-t border-line pt-4">
        <button onClick={() => setShowEmail((v) => !v)} aria-expanded={showEmail} className="flex w-full items-center justify-between text-[13px] font-semibold text-ink-2">
          Sign in with email
          <ChevronDown className={cx("h-4 w-4 transition", showEmail && "rotate-180")} aria-hidden />
        </button>
        {showEmail && (
          <form onSubmit={signIn} className="mt-3 space-y-3 animate-fade-up">
            <label className="label">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input h-10" placeholder="you@company.com" /></label>
            <label className="label">Password<input required type="password" autoComplete="current-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="field-input h-10" /></label>
            <Button type="submit" className="h-11 w-full" loading={busy === "email"}>Sign in</Button>
            <p className="text-center text-[13px] text-ink-muted">New here? <Link href="/signup" className="font-semibold text-ink underline-offset-2 hover:underline">Create an account</Link></p>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-ink-faint">Every action is logged with your name and time.</p>
    </div>
  );
}
