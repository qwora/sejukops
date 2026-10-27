"use client";

import { ClipboardList } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/primitives";
import { JobRow, NextJobCard } from "@/components/technician/job-bits";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { listCompletions, listOrders } from "@/lib/data";
import { useLoad } from "@/lib/use-load";
import { useSession } from "@/lib/session";
import { formatDate, isToday, money, startOfMyDay } from "@/lib/format";

export default function TechnicianJobsPage() {
  return (
    <MobileShell>
      <Today />
    </MobileShell>
  );
}

function greeting() {
  const hour = Number(new Date().toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", hour12: false }));
  return hour < 12 ? "Selamat pagi," : hour < 18 ? "Selamat petang," : "Selamat malam,";
}

function Today() {
  const session = useSession();
  const me = session.technicianName;
  const { data, error, loading, reload } = useLoad(async () => {
    const [orders, completions] = await Promise.all([listOrders(), listCompletions(startOfMyDay())]);
    return { orders, completions };
  }, [me]);

  const mine = (data?.orders ?? []).filter((o) => o.assignedTechnician === me);
  const byTime = (a: { scheduledAt: string | null }, b: { scheduledAt: string | null }) => (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9");
  const open = mine.filter((o) => o.status === "Assigned" || o.status === "In Progress").sort((a, b) => (a.status === "In Progress" ? -1 : b.status === "In Progress" ? 1 : byTime(a, b)));
  const todays = mine.filter((o) => isToday(o.scheduledAt) || (open.includes(o) && !o.scheduledAt)).sort(byTime);
  const upcoming = open.filter((o) => !todays.includes(o));
  const myToday = (data?.completions ?? []).filter((c) => c.technicianName === me);
  const collected = myToday.reduce((sum, c) => sum + c.paymentAmount, 0);
  const doneToday = myToday.length;
  const totalToday = Math.max(todays.length, doneToday);
  const next = open[0];

  return (
    <div>
      <header className="relative overflow-hidden bg-brand-grad px-5 pb-16 pt-6 text-white">
        <span className="pointer-events-none absolute -right-[150px] -top-[150px] h-[300px] w-[300px] rounded-full border-[34px] border-white/10" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-base font-medium">{(me ?? "?")[0]}</span>
          <div className="flex-1">
            <p className="text-[13px] font-light text-[#C9DAE4]">{greeting()}</p>
            <h1 className="text-xl font-light">{me ?? session.name}</h1>
          </div>
          <span className="rounded-full border border-white/25 px-3 py-1.5 text-xs">{formatDate(new Date().toISOString(), { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
      </header>

      <div className="relative mx-4 -mt-12 grid grid-cols-3 rounded-3xl bg-white p-4 text-center shadow-lift">
        <div>
          <div className="num text-[26px] font-extralight text-ink">{doneToday}<span className="text-base font-light text-ink-faint">/{totalToday}</span></div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">Done today</div>
        </div>
        <div className="border-x border-line">
          <div className="num whitespace-nowrap text-[22px] font-extralight leading-[1.2] text-ink sm:text-[26px]">{money(collected, 0)}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">Collected</div>
        </div>
        <div>
          <div className="num text-[26px] font-extralight text-ink">{open.length}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">Open jobs</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6 pt-5">
        <div className="lg:hidden"><InstallPrompt /></div>
        {session.mode === "account" && !me && (
          <p className="rounded-xl bg-warn-tint px-4 py-3 text-[13px] text-warn">Your account isn’t linked to a technician yet. Ask an admin to link it.</p>
        )}
        {error && <ErrorBanner message={"Could not load jobs: " + error} onRetry={() => reload()} />}
        {loading && !data && (
          <>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </>
        )}

        {data && (
          <>
            {next ? (
              <>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[22px] font-light tracking-tight text-ink">{next.status === "In Progress" ? "Current job" : "Next job"}</h2>
                  <span className="text-xs text-ink-muted">{open.length} open</span>
                </div>
                <NextJobCard job={next} />
              </>
            ) : (
              <div className="rounded-3xl border border-line bg-white">
                <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="No open jobs" body="New jobs from the admin team will appear here." />
              </div>
            )}

            {todays.length > 0 && (
              <>
                <h2 className="mt-2 text-base font-normal text-ink">Today&apos;s jobs</h2>
                <div className="rounded-3xl border border-line bg-white px-4">{todays.map((job) => <JobRow key={job.id} job={job} />)}</div>
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <h2 className="mt-2 text-base font-normal text-ink">Upcoming</h2>
                <div className="rounded-3xl border border-line bg-white px-4">{upcoming.map((job) => <JobRow key={job.id} job={job} />)}</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
