"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { DesktopShell, PageHeader } from "@/components/shell/desktop-shell";
import { Avatar, Card, cx, EmptyState, ErrorBanner, PageLoading } from "@/components/ui/primitives";
import { listCompletions, listOrders, listTechnicians } from "@/lib/data";
import { useLoad } from "@/lib/use-load";
import { money } from "@/lib/format";
import { computeKpis, type KpiPeriod } from "@/lib/kpi";

const BRANCH_COLORS: Record<string, string> = { "Shah Alam": "#2E7BAA", "Petaling Jaya": "#0E7490", "Kuala Lumpur": "#C2620A", Langkawi: "#6D4FC2", Penang: "#B42318" };

export default function DashboardPage() {
  return (
    <DesktopShell roles={["manager", "admin"]}>
      <Dashboard />
    </DesktopShell>
  );
}

function Change({ value, invert, suffix = "%" }: { value: number | null; invert?: boolean; suffix?: string }) {
  if (value === null) return <span className="text-xs font-semibold text-ok">new</span>;
  if (value === 0) return <span className="text-xs text-ink-muted">no change</span>;
  const good = invert ? value < 0 : value > 0;
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={cx("inline-flex items-center gap-0.5 text-xs font-semibold", good ? "text-ok" : "text-danger")}>
      <Icon className="h-3.5 w-3.5" />{value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
}

function Dashboard() {
  const [period, setPeriod] = useState<KpiPeriod>("week");
  const { data, error, loading, reload } = useLoad(async () => {
    const [orders, completions, techs] = await Promise.all([listOrders(), listCompletions(), listTechnicians()]);
    return { orders, completions, techs };
  });

  const k = useMemo(() => (data ? computeKpis(data.orders, data.completions, period, data.techs.map((t) => t.name)) : null), [data, period]);
  const maxDay = Math.max(1, ...(k?.days.map((d) => d.jobs + d.rescheduled) ?? [1]));
  const maxBranch = Math.max(1, ...(k?.branches.map(([, v]) => v) ?? [1]));
  const overloaded = k?.leaderboard.filter((t) => t.overloaded) ?? [];
  const lightest = k ? [...k.leaderboard].sort((a, b) => a.jobs + a.open - (b.jobs + b.open))[0] : null;

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-4">
      <PageHeader
        title="Performance"
        meta={
          <div className="flex gap-0.5 rounded-[9px] bg-rail p-0.5" role="tablist" aria-label="Period">
            {(["today", "week", "month"] as const).map((p) => (
              <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)} className={cx("h-7 rounded-[7px] px-3 text-[12.5px] font-semibold capitalize transition", period === p ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.12)]" : "text-ink-muted")}>
                {p === "week" ? "This week" : p === "month" ? "Month" : "Today"}
              </button>
            ))}
          </div>
        }
        subtitle={k ? k.bounds.label + " · vs " + k.bounds.prevLabel : undefined}
        actions={<Link href="/manager/assistant" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-ink-2 shadow-sec"><Sparkles className="h-4 w-4 text-ai" />Ask about this data</Link>}
      />
      {error && <ErrorBanner message={"Could not load metrics: " + error} onRetry={() => reload()} />}
      {loading && !data && <PageLoading rows={6} />}

      {k && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Jobs completed", value: String(k.jobs), extra: <Change value={k.jobsChange} /> },
              { label: "Revenue (final amounts)", value: money(k.revenue, 0), extra: <Change value={k.revenueChange} /> },
              { label: "Postponed / rescheduled", value: String(k.reschedules), extra: <Change value={k.reschedulesChange} invert suffix="" /> },
              { label: "Avg. job value", value: money(k.avgTicket, 0), extra: <span className="text-xs text-ink-muted">{k.awaitingReview} awaiting review</span> }
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <div className="text-xs font-medium text-ink-muted">{item.label}</div>
                <div className="num mt-1 text-[28px] font-extralight tracking-tight text-ink">{item.value}</div>
                <div className="mt-1">{item.extra}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-stretch gap-4">
            <Card className="min-w-0 flex-[999_1_520px]" title={period === "month" ? "Jobs completed per day this month" : "Jobs completed · last 7 days"} action={
              <div className="flex gap-3 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-brand" />Completed</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-[#E3B04B]" />Rescheduled</span>
              </div>
            }>
              <div className="flex h-[230px] items-stretch gap-1.5 pt-2" role="img" aria-label={"Bar chart: " + k.days.map((d) => `${d.label} ${d.jobs} jobs`).join(", ")}>
                {k.days.map((d, i) => {
                  const isLast = i === k.days.length - 1;
                  return (
                    <div key={d.key} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
                      <div className="flex w-full flex-1 flex-col items-center justify-end gap-[2px]">
                        <span className="num text-[11px] font-semibold text-ink-2 opacity-80 group-hover:opacity-100">{d.jobs || ""}</span>
                        {d.rescheduled > 0 && <div className="w-full max-w-[44px] rounded-t-[3px] bg-[#E3B04B]" style={{ height: (d.rescheduled / maxDay) * 170 }} />}
                        <div className={cx("w-full max-w-[44px] rounded-[3px] transition", isLast ? "bg-brand" : "bg-[#9CC5DE] group-hover:bg-brand")} style={{ height: Math.max(2, (d.jobs / maxDay) * 170) }} />
                      </div>
                      <span className={cx("text-[11px]", isLast ? "font-bold text-ink" : "font-medium text-ink-muted")}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="flex-[1_1_300px]" title="By branch">
              {k.branches.length === 0 && <p className="text-[13px] text-ink-muted">No completed jobs in this period.</p>}
              {k.branches.map(([name, value]) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between text-[13px]"><span className="font-medium">{name}</span><span className="num text-ink-muted">{value} jobs</span></div>
                  <div className="h-2 rounded-full bg-rail"><div className="h-2 rounded-full" style={{ width: (value / maxBranch) * 100 + "%", background: BRANCH_COLORS[name] ?? "#8AA2B0" }} /></div>
                </div>
              ))}
              <div className="mt-auto rounded-[10px] bg-ai-tint px-3 py-2.5 text-[12.5px] leading-relaxed text-ai-ink shadow-[0_0_0_1px_#E2D5FA]">
                <b>Insight: </b>
                {overloaded.length
                  ? overloaded.map((t) => `${t.name} completed ${t.jobs} jobs, ${t.ratio.toFixed(1)}× the team average of ${k.average.toFixed(1)}.`).join(" ") + (lightest && !overloaded.includes(lightest) ? ` Consider routing new jobs to ${lightest.name}.` : "")
                  : `Workload is balanced. Team average is ${k.average.toFixed(1)} jobs.`}
              </div>
            </Card>
          </div>

          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center px-4 py-3.5"><h2 className="text-sm font-semibold text-ink">Technician leaderboard</h2><span className="ml-auto text-xs text-ink-muted">Sorted by jobs completed</span></div>
            {k.leaderboard.length === 0 ? (
              <EmptyState title="No technicians" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="text-xs text-ink-muted">
                      {["#", "Technician", "Jobs", "Revenue", "Avg. job", "Reschedules", "Open now", "Workload"].map((h, i) => (
                        <th key={h} className={cx("whitespace-nowrap border-b border-line px-3 py-2 font-medium", i === 0 && "pl-4", i >= 2 && i <= 6 && "text-right", i === 7 && "w-[180px]")}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {k.leaderboard.map((t, i) => {
                      const tone = t.overloaded ? "#B42318" : t.jobs === 0 ? "#8AA2B0" : "#2E7BAA";
                      return (
                        <tr key={t.name} className="border-b border-line text-[13px]">
                          <td className="num py-2.5 pl-4 pr-3 font-bold" style={{ color: i < 3 && t.jobs ? "#2E7BAA" : "#8AA2B0" }}>{i + 1}</td>
                          <td className="px-3 py-2.5"><span className="flex items-center gap-2.5"><Avatar name={t.name} size={28} /><span className="font-semibold">{t.name}</span></span></td>
                          <td className="num px-3 py-2.5 text-right font-semibold">{t.jobs}</td>
                          <td className="num px-3 py-2.5 text-right">{money(t.amount, 0)}</td>
                          <td className="num px-3 py-2.5 text-right text-ink-muted">{t.jobs ? money(t.avgTicket, 0) : "—"}</td>
                          <td className={cx("num px-3 py-2.5 text-right", t.reschedules >= 2 && "font-semibold text-danger")}>{t.reschedules}</td>
                          <td className="num px-3 py-2.5 text-right">{t.open}</td>
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 flex-1 rounded-full bg-rail"><span className="block h-1.5 rounded-full" style={{ width: Math.min(100, t.ratio * 50) + "%", background: tone }} /></span>
                              <span className="w-[72px] text-[11px] font-semibold" style={{ color: tone }}>{t.overloaded ? "Overloaded" : t.jobs === 0 ? "Idle" : "Normal"}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
