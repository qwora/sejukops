import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

const orders = [
  { id: "ORDER1234", customer: "Ahmad Rahman", service: "Aircond cleaning", technician: "Ali", amount: "RM180", status: "New", date: "Today, 9:42 AM" },
  { id: "ORDER1235", customer: "Siti Aminah", service: "Wall-mounted repair", technician: "John", amount: "RM320", status: "Assigned", date: "Today, 8:15 AM" },
  { id: "ORDER1236", customer: "Lee Wei Ming", service: "Gas refill", technician: "Bala", amount: "RM240", status: "In Progress", date: "Yesterday" },
  { id: "ORDER1237", customer: "Nadia Yusuf", service: "Installation", technician: "Yusoff", amount: "RM850", status: "Job Done", date: "Yesterday" }
];

const statusClass: Record<string, string> = {
  New: "status-new",
  Assigned: "status-assigned",
  "In Progress": "status-progress",
  "Job Done": "status-done"
};

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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-ink">Recent orders</h2>
              <p className="mt-1 text-sm text-slate-500">Track every service request from intake to completion.</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">All statuses</button>
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">This week</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Service</th>
                  <th className="px-5 py-3 font-semibold">Technician</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link href={\`/admin/orders/\${order.id}\`} className="font-semibold text-sea hover:underline">{order.id}</Link>
                      <p className="mt-1 text-xs text-slate-400">{order.date}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-ink">{order.customer}</td>
                    <td className="px-5 py-4 text-slate-600">{order.service}</td>
                    <td className="px-5 py-4 text-slate-600">{order.technician}</td>
                    <td className="px-5 py-4 font-semibold text-ink">{order.amount}</td>
                    <td className="px-5 py-4"><span className={\`status-pill \${statusClass[order.status]}\`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PortalShell>
  );
}
