"use client";

import { ClipboardList } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/primitives";
import { JobRow, NextJobCard } from "@/components/technician/job-bits";
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
      <header className="bg-brand px-5 pb-16 pt-6 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-base font-bold">{(me ?? "?")[0]}</span>
          <div className="flex-1">
            <p className="text-[13px] text-white/80">{greeting()}</p>
            <h1 className="text-lg font-bold">{me ?? session.name}</h1>
          </div>
          <span className="rounded-full bg-black/20 px-3 py-1.5 text-xs font-semibold">{formatDate(new Date().toISOString(), { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
      </header>

      <div className="relative mx-4 -mt-12 grid grid-cols-3 rounded-2xl bg-white p-4 text-center shadow-lift">
        <div>
          <div className="num text-[22px] font-extrabold text-ink">{doneToday}<span className="text-[15px] font-semibold text-ink-faint">/{totalToday}</span></div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">Done today</div>
        </div>
        <div className="border-x border-[#F1F1F1]">
          <div className="num text-[22px] font-extrabold text-ink">{money(collected, 0)}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">Collected</div>
        </div>
        <div>
          <div className="num text-[22px] font-extrabold text-ink">{open.length}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">Open jobs</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-5">
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
                  <h2 className="text-[17px] font-bold text-ink">{next.status === "In Progress" ? "Current job" : "Next job"}</h2>
                  <span className="text-xs text-ink-muted">{open.length} open</span>
                </div>
                <NextJobCard job={next} />
              </>
            ) : (
              <div className="rounded-2xl bg-white">
                <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="No open jobs" body="New jobs from the admin team will appear here." />
              </div>
            )}

            {todays.length > 0 && (
              <>
                <h2 className="mt-2 text-[15px] font-bold text-ink">Today&apos;s jobs</h2>
                <div className="rounded-2xl bg-white px-4">{todays.map((job) => <JobRow key={job.id} job={job} />)}</div>
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <h2 className="mt-2 text-[15px] font-bold text-ink">Upcoming</h2>
                <div className="rounded-2xl bg-white px-4">{upcoming.map((job) => <JobRow key={job.id} job={job} />)}</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
