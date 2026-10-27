import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { OrderList } from "@/components/orders/order-list";

export default function AdminOrdersPage() {
  return (
    <PortalShell role="Admin" active="Orders">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Admin workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Orders</h1>
          </div>
          <Link href="/admin/orders/new" className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Create order
          </Link>
        </div>
      </header>

      <section className="space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Open orders", "24", "Needs attention"],
            ["In progress", "11", "Across 5 branches"],
            ["Completed this week", "68", "+12% from last week"]
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
              <p className="mt-2 text-xs text-slate-400">{note}</p>
            </div>
          ))}
        </div>
        <OrderList />
      </section>
    </PortalShell>
  );
}
