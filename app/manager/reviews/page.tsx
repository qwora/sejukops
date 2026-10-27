"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { closeDbOrder, ensureDemoData, listDbCompletions, listOrders, reviewDbOrder } from "@/lib/supabase/operations";
import type { ServiceCompletion } from "@/lib/service-completion";
import type { ServiceOrder } from "@/lib/order-types";

export default function ManagerReviewsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [completions, setCompletions] = useState<ServiceCompletion[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState("");

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
  const approvedJobs = useMemo(() => orders.filter((order) => order.status === "Reviewed"), [orders]);
  function completionFor(orderNo: string) { return completions.find((item) => item.orderNo === orderNo); }

  async function updateReview(orderNo: string, status: "Reviewed" | "In Progress") {
    setError("");
    setBusyOrder(orderNo);
    try {
      await reviewDbOrder(orderNo, status === "Reviewed" ? "reviewed" : "in_progress");
      setOrders((current) => current.map((order) => order.orderNo === orderNo ? { ...order, status } : order));
      setNotice(status === "Reviewed" ? orderNo + " approved and ready to close." : orderNo + " returned to the technician.");
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Could not update this review.");
    } finally {
      setBusyOrder("");
    }
  }

  async function closeOrder(orderNo: string) {
    setError("");
    setBusyOrder(orderNo);
    try {
      await closeDbOrder(orderNo);
      setOrders((current) => current.map((order) => order.orderNo === orderNo ? { ...order, status: "Closed" } : order));
      setNotice(orderNo + " closed successfully.");
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Could not close this order.");
    } finally {
      setBusyOrder("");
    }
  }

  function renderCompletion(job: ServiceOrder, approved = false) {
    const completion = completionFor(job.orderNo);
    const finalAmount = completion?.finalAmount ?? job.quotedPrice;
    const fileCount = completion?.fileNames.length ?? 0;
    const technicianName = completion?.technicianName || job.assignedTechnician || "Technician";
    return (
      <article key={job.orderNo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3"><span className="font-semibold text-sea">{job.orderNo}</span><span className={"status-pill " + (approved ? "status-done" : "status-review")}>{approved ? "Approved" : "Needs review"}</span></div>
            <h2 className="mt-3 text-lg font-semibold text-ink">{job.serviceType} · {job.customerName}</h2>
            <p className="mt-1 text-sm text-slate-500">Completed by {technicianName} · {fileCount} uploaded files</p>
            {completion && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{completion.workDone}</p>}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="text-left sm:text-right"><p className="text-xs uppercase tracking-wide text-slate-400">Final amount</p><p className="mt-1 font-semibold text-ink">RM{finalAmount.toFixed(2)}</p><p className={"mt-1 text-xs " + (finalAmount === job.quotedPrice ? "text-emerald-600" : "text-amber-600")}>Quoted RM{job.quotedPrice.toFixed(2)}</p></div>
            <div className="flex gap-2">
              {approved ? <button disabled={busyOrder === job.orderNo} onClick={() => closeOrder(job.orderNo)} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busyOrder === job.orderNo ? "Closing..." : "Close order"}</button> : <><button disabled={busyOrder === job.orderNo} onClick={() => updateReview(job.orderNo, "In Progress")} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-60">Return</button><button disabled={busyOrder === job.orderNo} onClick={() => updateReview(job.orderNo, "Reviewed")} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Approve</button></>}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <PortalShell role="Manager" active="Review queue">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10"><p className="text-sm font-semibold uppercase tracking-wide text-sea">Manager workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Review queue</h1><p className="mt-2 text-sm text-slate-500">Approve completed work, return corrections, then close approved orders.</p></header>
      <section className="space-y-8 px-6 py-8 md:px-10">
        {notice && <div role="status" className="rounded-xl bg-mint px-4 py-3 text-sm font-medium text-emerald-900">{notice}</div>}
        {error && <div role="alert" className="rounded-xl bg-rose px-4 py-3 text-sm text-red-800">Could not update the workflow: {error}</div>}
        {loading && <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">Loading completed jobs...</div>}

        {!loading && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Needs review</h2><span className="text-xs text-slate-400">{reviewJobs.length} jobs</span></div>{reviewJobs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No completed jobs are waiting for review.</div> : <div className="space-y-4">{reviewJobs.map((job) => renderCompletion(job))}</div>}</section>}

        {!loading && approvedJobs.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Approved · ready to close</h2><span className="text-xs text-slate-400">{approvedJobs.length} jobs</span></div><div className="space-y-4">{approvedJobs.map((job) => renderCompletion(job, true))}</div></section>}
      </section>
    </PortalShell>
  );
}
