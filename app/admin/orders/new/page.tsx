import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

export default function NewOrderPage() {
  return (
    <PortalShell role="Admin" active="Orders">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
        <p className="text-sm text-slate-500">Admin workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Create order</h1>
      </header>
      <main className="max-w-3xl px-6 py-8 md:px-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm leading-6 text-slate-600">
            The order form will be implemented in Phase 2. This route confirms the application shell and navigation structure.
          </p>
          <Link href="/admin/orders" className="mt-6 inline-flex rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">
            Back to orders
          </Link>
        </div>
      </main>
    </PortalShell>
  );
}
