"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ensureDemoData, listDbCompletions, listOrders, reviewDbOrder } from "@/lib/supabase/operations";
import type { ServiceCompletion } from "@/lib/service-completion";
import type { ServiceOrder } from "@/lib/order-types";

export default function ManagerReviewsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [completions, setCompletions] = useState<ServiceCompletion[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await ensureDemoData();
        const [loadedOrders, loadedCompletions] = await Promise.all([listOrders(), listDbCompletions()]);
        if (active) { setOrders(loadedOrders); setCompletions(loadedCompletions); }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load the review queue.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const reviewJobs = useMemo(() => orders.filter((order) => order.status === "Job Done"), [orders]);
  function completionFor(orderNo: string) { return completions.find((item) => item.orderNo === orderNo); }

  async function updateReview(orderNo: string, status: "Reviewed" | "In Progress") {
    setError("");
    try {
      await reviewDbOrder(orderNo, status === "Reviewed" ? "reviewed" : "in_progress");
      setOrders((current) => current.map((order) => order.orderNo === orderNo ? { ...order, status } : order));
      setNotice(status === "Reviewed" ? orderNo + " approved and ready to close." : orderNo + " returned to the technician.");
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Could not update this review.");
    }
  }

  return (
    <PortalShell role="Manager" active="Review queue">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10"><p className="text-sm text-slate-500">Manager workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Review queue</h1><p className="mt-2 text-sm text-slate-500">Check completed service work before it is closed.</p></header>
      <section className="space-y-4 px-6 py-8 md:px-10">
        {notice && <div role="status" className="rounded-xl bg-mint px-4 py-3 text-sm font-medium text-emerald-900">{notice}</div>}
        {error && <div role="alert" className="rounded-xl bg-rose px-4 py-3 text-sm text-red-800">Could not update the review queue: {error}</div>}
        {loading && <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">Loading completed jobs...</div>}
        {!loading && reviewJobs.length === 0 && !error ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">No completed jobs are waiting for review.</div> : reviewJobs.map((job) => {
          const completion = completionFor(job.orderNo);
          const finalAmount = completion?.finalAmount ?? job.quotedPrice;
          const fileCount = completion?.fileNames.length ?? 0;
          const technicianName = completion?.technicianName || job.assignedTechnician || "Technician";
          return <article key={job.orderNo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><div className="flex flex-wrap items-center gap-3"><span className="font-semibold text-sea">{job.orderNo}</span><span className="status-pill status-review">Needs review</span></div><h2 className="mt-3 text-lg font-semibold text-ink">{job.serviceType} · {job.customerName}</h2><p className="mt-1 text-sm text-slate-500">Completed by {technicianName} · {fileCount} uploaded files</p>{completion && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{completion.workDone}</p>}</div><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="text-left sm:text-right"><p className="text-xs uppercase tracking-wide text-slate-400">Final amount</p><p className="mt-1 font-semibold text-ink">RM{finalAmount.toFixed(2)}</p><p className={"mt-1 text-xs " + (finalAmount === job.quotedPrice ? "text-emerald-600" : "text-amber-600")}>Quoted RM{job.quotedPrice.toFixed(2)}</p></div><div className="flex gap-2"><button onClick={() => updateReview(job.orderNo, "In Progress")} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Return</button><button onClick={() => updateReview(job.orderNo, "Reviewed")} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Approve</button></div></div></div></article>;
        })}
      </section>
    </PortalShell>
  );
}
