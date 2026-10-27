"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/auth";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    if (typeof window !== "undefined") window.sessionStorage.removeItem("sejuksejuk.demo.role");
    router.push("/login");
  }

  return <button onClick={handleSignOut} disabled={busy} className="mt-3 text-left text-xs text-white/55 hover:text-white disabled:opacity-50">{busy ? "Signing out..." : "Sign out"}</button>;
}
