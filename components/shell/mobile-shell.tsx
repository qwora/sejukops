"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardList, History, LogOut } from "lucide-react";
import { RoleGuard } from "./role-guard";
import { BrandLockup } from "./brand";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { JOB_STATE } from "@/components/technician/job-bits";
import { useSession, clearDemo } from "@/lib/session";
import { signOut } from "@/lib/supabase/auth";
import { listOrders } from "@/lib/data";
import { useLoad } from "@/lib/use-load";
import { formatTime, isToday } from "@/lib/format";
import { cx } from "@/components/ui/primitives";

/**
 * Technician frame. Mobile-first, but not forced:
 * - phone: full-screen screens with a bottom tab bar
 * - tablet / desktop (lg+): job list on the left, the current screen in a centred column
 */
export function MobileShell({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  return (
    <RoleGuard roles={["technician"]}>
      <div className="min-h-screen bg-canvas lg:flex lg:bg-rail">
        <JobsRail />
        <div className="min-w-0 flex-1 lg:px-8 lg:py-6">
          <div className={cx("relative mx-auto w-full max-w-[640px] bg-canvas lg:min-h-[calc(100vh-48px)] lg:overflow-clip lg:rounded-[28px] lg:shadow-card", tabs && "pb-[84px] lg:pb-0")}>
            {children}
          </div>
        </div>
        {tabs && <TabBar />}
      </div>
    </RoleGuard>
  );
}

function useLeave() {
  const router = useRouter();
  return async () => {
    try { await signOut(); } catch { /* ignore */ }
    clearDemo();
    router.push("/login");
  };
}

/** Desktop-only side panel: the technician's open and today's jobs, always one click away. */
function JobsRail() {
  const session = useSession();
  const pathname = usePathname();
  const leave = useLeave();
  const me = session.technicianName;
  const { data } = useLoad(() => listOrders(), [me, pathname]);
  const jobs = (data ?? [])
    .filter((o) => o.assignedTechnician === me && (o.status === "Assigned" || o.status === "In Progress" || isToday(o.scheduledAt)))
    .sort((a, b) => (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9"));

  const navItem = (href: string, label: string, icon: ReactNode, active: boolean) => (
    <Link href={href} aria-current={active ? "page" : undefined} className={cx("flex h-10 items-center gap-2.5 rounded-full px-3.5 text-[13px] font-medium transition", active ? "bg-white text-navy shadow-card" : "text-ink-2 hover:bg-white/70")}>
      {icon}
      {label}
    </Link>
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-[320px] flex-none flex-col bg-rail lg:flex" aria-label="Technician">
      <div className="bg-navy px-5 py-4">
        <BrandLockup size={22} />
        <p className="mt-2 text-xs font-light text-frost">{me ? me + " · Technician" : "Technician"}</p>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItem("/technician/jobs", "Today", <ClipboardList className="h-[18px] w-[18px]" />, pathname === "/technician/jobs")}
        {navItem("/technician/history", "History", <History className="h-[18px] w-[18px]" />, pathname.startsWith("/technician/history"))}
      </nav>
      <p className="eyebrow px-6 pb-2 pt-3 text-ink-muted">My jobs</p>
      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {jobs.length === 0 && <li className="px-3 py-4 text-[13px] text-ink-muted">No open jobs.</li>}
        {jobs.map((job) => {
          const active = pathname.startsWith("/technician/jobs/" + job.orderNo);
          return (
            <li key={job.id}>
              <Link href={"/technician/jobs/" + job.orderNo} aria-current={active ? "page" : undefined} className={cx("flex items-center gap-3 rounded-2xl px-3 py-2.5 transition", active ? "bg-white shadow-card" : "hover:bg-white/70")}>
                <span className="num w-11 text-[13px] font-medium text-ink">{job.scheduledAt ? formatTime(job.scheduledAt) : "—"}</span>
                <span className="h-2 w-2 flex-none rounded-full" style={{ background: JOB_STATE[job.status].dot }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{job.serviceType}</span>
                  <span className="block truncate text-xs text-ink-muted">{job.orderNo} · {job.customerName}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line-strong p-3">
        <InstallPrompt compact />
        <button onClick={leave} className="flex h-10 w-full items-center gap-2.5 rounded-full px-3.5 text-[13px] font-medium text-ink-2 hover:bg-white/70">
          <LogOut className="h-[18px] w-[18px]" />
          {session.mode === "demo" ? "Switch role" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}

/** Phone-only bottom tab bar. */
function TabBar() {
  const pathname = usePathname();
  const session = useSession();
  const leave = useLeave();
  const historyActive = pathname.startsWith("/technician/history");
  const jobsActive = pathname.startsWith("/technician/jobs");
  const tab = "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium";

  return (
    <nav aria-label="Technician" className="fixed inset-x-0 bottom-0 z-30 flex h-[76px] items-start border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
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
