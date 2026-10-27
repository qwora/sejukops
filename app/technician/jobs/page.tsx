"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ensureDemoData, listOrders } from "@/lib/supabase/operations";
import type { ServiceOrder } from "@/lib/order-types";

const CURRENT_TECHNICIAN = "Ali";

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

  return (
    <PortalShell role="Technician" active="My jobs">
      <main className="mx-auto max-w-xl px-5 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Good morning, {CURRENT_TECHNICIAN}</h1>
          </div>
          <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-emerald-800">{jobs.length} jobs today</span>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl bg-rose px-4 py-3 text-sm text-red-800">Could not load jobs: {error}</div>}
        {loading && <p className="mt-8 text-sm text-slate-500">Loading your jobs...</p>}

        <div className="mt-8 space-y-4">
          {jobs.map((job, index) => (
            <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sea">{index === 0 ? "10:00 AM" : "2:30 PM"}</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{job.serviceType}</h2>
                  <p className="mt-1 text-sm text-slate-500">{job.customerName}</p>
                </div>
                <span className={"status-pill " + (job.status === "In Progress" ? "status-progress" : job.status === "Job Done" ? "status-done" : "status-assigned")}>{job.status}</span>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm leading-6 text-slate-600">{job.address}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{job.orderNo}</p>
              </div>
              <Link href={"/technician/jobs/" + job.orderNo} className={"mt-5 block w-full rounded-2xl px-4 py-3.5 text-center text-sm font-semibold " + (index === 0 ? "bg-ink text-white" : "border border-slate-200 text-ink")}>
                {job.status === "Job Done" ? "View completed job" : index === 0 ? "Open job" : "View details"}
              </Link>
            </article>
          ))}
        </div>

        {!loading && jobs.length === 0 && !error && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">No jobs are assigned to you.</div>}
      </main>
    </PortalShell>
  );
}
