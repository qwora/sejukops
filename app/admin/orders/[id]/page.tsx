import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PortalShell role="Admin" active="Orders">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
        <p className="text-sm text-slate-500">Order detail</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{id}</h1>
      </header>
      <main className="max-w-3xl px-6 py-8 md:px-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <span className="status-pill status-new">New</span>
          <h2 className="mt-5 text-xl font-semibold text-ink">Order detail workspace</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Assignment, status history and customer details will be added in Phase 2.
          </p>
          <Link href="/admin/orders" className="mt-6 inline-flex rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">
            Back to orders
          </Link>
        </div>
      </main>
    </PortalShell>
  );
}
