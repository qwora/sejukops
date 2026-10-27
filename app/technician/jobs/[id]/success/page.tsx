import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

export default async function TechnicianSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <PortalShell role="Technician" active="My jobs">
      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="rounded-3xl border border-emerald-100 bg-white p-7 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-3xl text-emerald-700">✓</div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Service submitted</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Job marked done</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Order <span className="font-semibold text-ink">{id}</span> has been saved with its service details and evidence.</p>
          <div className="mt-7 rounded-2xl bg-slate-50 px-5 py-4 text-left text-sm text-slate-600">
            <p className="font-semibold text-ink">What happens next?</p>
            <p className="mt-2 leading-6">A manager will review the completion before the order is closed.</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link href="/technician/jobs" className="rounded-2xl bg-ink px-4 py-3.5 text-sm font-semibold text-white">Back to my jobs</Link>
            <Link href="/manager/reviews" className="rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-ink">Open review queue</Link>
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
