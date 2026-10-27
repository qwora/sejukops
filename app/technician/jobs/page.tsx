import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

const jobs = [
  { id: "ORDER1235", time: "10:00 AM", customer: "Siti Aminah", service: "Wall-mounted repair", address: "No. 12, Jalan Sejuk, Shah Alam", status: "Assigned" },
  { id: "ORDER1236", time: "2:30 PM", customer: "Lee Wei Ming", service: "Gas refill", address: "18, Jalan Murni, Petaling Jaya", status: "In Progress" }
];

export default function TechnicianJobsPage() {
  return (
    <PortalShell role="Technician" active="My jobs">
      <main className="mx-auto max-w-xl px-5 py-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">Tuesday, 27 October</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Good morning, Ali</h1>
          </div>
          <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-emerald-800">2 jobs today</span>
        </div>

        <div className="mt-8 space-y-4">
          {jobs.map((job, index) => (
            <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sea">{job.time}</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{job.service}</h2>
                  <p className="mt-1 text-sm text-slate-500">{job.customer}</p>
                </div>
                <span className={"status-pill " + (job.status === "In Progress" ? "status-progress" : "status-assigned")}>{job.status}</span>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm leading-6 text-slate-600">{job.address}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{job.id}</p>
              </div>
              <Link
                href={"/technician/jobs/" + job.id}
                className={"mt-5 block w-full rounded-2xl px-4 py-3.5 text-center text-sm font-semibold " + (index === 0 ? "bg-ink text-white" : "border border-slate-200 text-ink")}
              >
                {index === 0 ? "Open job" : "View details"}
              </Link>
            </article>
          ))}
        </div>
      </main>
    </PortalShell>
  );
}
