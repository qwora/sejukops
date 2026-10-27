"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ensureDemoData, listOrders } from "@/lib/supabase/operations";
import type { ServiceOrder } from "@/lib/order-types";

const CURRENT_TECHNICIAN = "Ali";
const historyStatuses = ["Job Done", "Reviewed", "Closed"];

function statusClass(status: ServiceOrder["status"]) {
  if (status === "In Progress") return "status-progress";
  if (status === "Job Done" || status === "Closed") return "status-done";
  if (status === "Reviewed") return "status-review";
  return "status-assigned";
}

function JobCard({ job, index }: { job: ServiceOrder; index: number }) {
  const completed = historyStatuses.includes(job.status);
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sea">{index === 0 ? "10:00 AM" : "2:30 PM"}</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{job.serviceType}</h2>
          <p className="mt-1 text-sm text-slate-500">{job.customerName}</p>
        </div>
        <span className={"status-pill " + statusClass(job.status)}>{job.status}</span>
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm leading-6 text-slate-600">{job.address}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{job.orderNo}</p>
      </div>
      <Link href={completed ? "/technician/jobs/" + job.orderNo + "?completed=1" : "/technician/jobs/" + job.orderNo} className={"mt-5 block w-full rounded-2xl px-4 py-3.5 text-center text-sm font-semibold " + (index === 0 && !completed ? "bg-ink text-white" : "border border-slate-200 text-ink")}>
        {completed ? "View service record" : index === 0 ? "Open job" : "View details"}
      </Link>
    </article>
  );
}

export default function TechnicianJobsPage() {
  const [jobs, setJobs] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await ensureDemoData();
        const orders = await listOrders();
        if (active) setJobs(orders.filter((order) => order.assignedTechnician === CURRENT_TECHNICIAN));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load assigned jobs.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const activeJobs = jobs.filter((job) => !historyStatuses.includes(job.status));
  const history = jobs.filter((job) => historyStatuses.includes(job.status));

  return (
    <PortalShell role="Technician" active="My jobs">
      <main className="mx-auto max-w-xl px-5 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sea">Technician dashboard</p>
            <p className="mt-2 text-sm text-slate-500">{new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Good morning, {CURRENT_TECHNICIAN}</h1>
          </div>
          <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-emerald-800">{activeJobs.length} active jobs</span>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl bg-rose px-4 py-3 text-sm text-red-800">Could not load jobs: {error}</div>}
        {loading && <p className="mt-8 text-sm text-slate-500">Loading your jobs...</p>}

        {!loading && activeJobs.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Today’s route</h2><span className="text-xs text-slate-400">{activeJobs.length} active</span></div>
            <div className="space-y-4">{activeJobs.map((job, index) => <JobCard key={job.id} job={job} index={index} />)}</div>
          </section>
        )}

        {!loading && history.length > 0 && (
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Completion history</h2><span className="text-xs text-slate-400">{history.length} recorded</span></div>
            <div className="space-y-4">{history.map((job, index) => <JobCard key={job.id} job={job} index={index} />)}</div>
          </section>
        )}

        {!loading && jobs.length === 0 && !error && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">No jobs are assigned to you.</div>}
      </main>
    </PortalShell>
  );
}
