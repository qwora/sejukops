import { PortalShell } from "@/components/portal-shell";

const reviewJobs = [
  { id: "ORDER1237", customer: "Nadia Yusuf", service: "Installation", technician: "Yusoff", final: "RM920", quote: "RM850", files: 4 },
  { id: "ORDER1229", customer: "Farid Ismail", service: "Deep cleaning", technician: "Ali", final: "RM180", quote: "RM180", files: 3 },
  { id: "ORDER1224", customer: "Mei Ling", service: "Repair", technician: "John", final: "RM450", quote: "RM350", files: 1 }
];

export default function ManagerReviewsPage() {
  return (
    <PortalShell role="Manager" active="Review queue">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
        <p className="text-sm text-slate-500">Manager workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Review queue</h1>
        <p className="mt-2 text-sm text-slate-500">Check completed service work before it is closed.</p>
      </header>

      <section className="space-y-4 px-6 py-8 md:px-10">
        {reviewJobs.map((job) => (
          <article key={job.id} className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-sea">{job.id}</span>
                <span className="status-pill status-review">Needs review</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-ink">{job.service} · {job.customer}</h2>
              <p className="mt-1 text-sm text-slate-500">Completed by {job.technician} · {job.files} uploaded files</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Final amount</p>
                <p className="mt-1 font-semibold text-ink">{job.final}</p>
                <p className={"mt-1 text-xs " + (job.final === job.quote ? "text-emerald-600" : "text-amber-600")}>Quoted {job.quote}</p>
              </div>
              <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Review job</button>
            </div>
          </article>
        ))}
      </section>
    </PortalShell>
  );
}
