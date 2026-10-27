"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardList, History, LogOut } from "lucide-react";
import { RoleGuard } from "./role-guard";
import { useSession, clearDemo } from "@/lib/session";
import { signOut } from "@/lib/supabase/auth";
import { cx } from "@/components/ui/primitives";

/**
 * Technician frame: phone-first. On larger screens it stays phone-width and centred,
 * so the field UI never stretches into a desktop layout.
 */
export function MobileShell({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  return (
    <RoleGuard roles={["technician"]}>
      <div className="min-h-screen bg-[#E3E9ED] md:py-6">
        <div className="relative mx-auto flex min-h-screen max-w-[440px] flex-col overflow-hidden bg-canvas md:min-h-[calc(100vh-48px)] md:rounded-[28px] md:shadow-[0_20px_60px_rgba(0,0,0,.18)]">
          <div className={cx("flex-1", tabs && "pb-[76px]")}>{children}</div>
          {tabs && <TabBar />}
        </div>
      </div>
    </RoleGuard>
  );
}

function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const historyActive = pathname.startsWith("/technician/history");
  const jobsActive = pathname.startsWith("/technician/jobs");

  async function leave() {
    try { await signOut(); } catch { /* ignore */ }
    clearDemo();
    router.push("/login");
  }

  const tab = "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold min-h-[52px]";
  return (
    <nav aria-label="Technician" className="absolute inset-x-0 bottom-0 flex h-[72px] items-start border-t border-line bg-white px-2 pt-2 md:rounded-b-[28px]">
      <Link href="/technician/jobs" aria-current={jobsActive ? "page" : undefined} className={cx(tab, jobsActive ? "text-brand" : "text-ink-faint")}>
        <ClipboardList className="h-[22px] w-[22px]" aria-hidden />Jobs
      </Link>
      <Link href="/technician/history" aria-current={historyActive ? "page" : undefined} className={cx(tab, historyActive ? "text-brand" : "text-ink-faint")}>
        <History className="h-[22px] w-[22px]" aria-hidden />History
      </Link>
      <button onClick={leave} className={cx(tab, "text-ink-faint")}>
        <LogOut className="h-[22px] w-[22px]" aria-hidden />
        {session.mode === "demo" ? "Switch" : "Sign out"}
      </button>
    </nav>
  );
}
