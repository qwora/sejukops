"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ensureDemoData, getOperationsKpis, type OperationsKpis } from "@/lib/supabase/operations";

function money(value: number) {
  return "RM" + value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ManagerDashboardPage() {
  const [kpis, setKpis] = useState<OperationsKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await ensureDemoData();
        const result = await getOperationsKpis();
        if (active) setKpis(result);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load operational metrics.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <PortalShell role="Manager" active="Dashboard">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-sea">Manager dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Operations overview</h1>
        <p className="mt-2 text-sm text-slate-500">Weekly performance from completed service records.</p>
      </header>

      <main className="space-y-8 px-6 py-8 md:px-10">
        {error && <div role="alert" className="rounded-xl bg-rose px-4 py-3 text-sm text-red-800">Could not load metrics: {error}</div>}
        {loading && <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">Loading operational metrics...</div>}

        {!loading && kpis && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Completed this week", String(kpis.completedThisWeek), "Based on submitted service records"],
                ["Amount this week", money(kpis.totalAmountThisWeek), "Final amounts, including extras"],
                ["Awaiting review", String(kpis.awaitingReview), "Job Done orders"],
                ["Active orders", String(kpis.activeOrders), "Not yet reviewed or closed"]
              ].map(([label, value, note]) => (
                <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div><h2 className="font-semibold text-ink">Technician leaderboard</h2><p className="mt-1 text-sm text-slate-500">Completed jobs this week</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live data</span>
                </div>
                {kpis.leaderboard.length === 0 ? (
                  <p className="mt-8 text-sm text-slate-500">No completed jobs recorded this week.</p>
                ) : (
                  <div className="mt-6 space-y-3">
                    {kpis.leaderboard.map((item, index) => (
                      <div key={item.technicianName} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{index + 1}</span><span className="font-medium text-ink">{item.technicianName}</span></div>
                        <div className="text-right"><p className="font-semibold text-ink">{item.jobsCompleted} {item.jobsCompleted === 1 ? "job" : "jobs"}</p><p className="text-xs text-slate-500">{money(item.totalAmount)}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <aside className="rounded-2xl bg-ink p-6 text-white shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Manager actions</p>
                <h2 className="mt-3 text-xl font-semibold">Keep the queue moving</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">Review completed work, compare final charges with the quote, and return anything that needs follow-up.</p>
                <Link href="/manager/reviews" className="mt-6 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-ink">Open review queue</Link>
              </aside>
            </section>
          </>
        )}
      </main>
    </PortalShell>
  );
}
