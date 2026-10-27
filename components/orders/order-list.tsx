"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readDemoOrders } from "@/lib/demo-orders";
import type { ServiceOrder, OrderStatus } from "@/lib/order-types";

const statusClass: Record<OrderStatus, string> = {
  New: "status-new",
  Assigned: "status-assigned",
  "In Progress": "status-progress",
  "Job Done": "status-done",
  Reviewed: "status-review",
  Closed: "status-done"
};

const statuses: Array<"All" | OrderStatus> = ["All", "New", "Assigned", "In Progress", "Job Done", "Reviewed", "Closed"];

export function OrderList() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | OrderStatus>("All");

  useEffect(() => {
    setOrders(readDemoOrders());
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = !query || [order.orderNo, order.customerName, order.serviceType, order.assignedTechnician, order.branch]
        .join(" ")
        .toLowerCase()
        .includes(query);
      const matchesStatus = status === "All" || order.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold text-ink">All orders</h2>
          <p className="mt-1 text-sm text-slate-500">{filteredOrders.length} orders shown</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search orders..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "All" | OrderStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100"
          >
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Order</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Service</th>
              <th className="px-5 py-3 font-semibold">Technician</th>
              <th className="px-5 py-3 font-semibold">Quote</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <Link href={"/admin/orders/" + order.orderNo} className="font-semibold text-sea hover:underline">{order.orderNo}</Link>
                  <p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-ink">{order.customerName}</p>
                  <p className="mt-1 text-xs text-slate-400">{order.branch}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{order.serviceType}</td>
                <td className="px-5 py-4 text-slate-600">{order.assignedTechnician || "Unassigned"}</td>
                <td className="px-5 py-4 font-semibold text-ink">RM{order.quotedPrice.toFixed(2)}</td>
                <td className="px-5 py-4"><span className={"status-pill " + statusClass[order.status]}>{order.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-slate-500">No orders match the current search.</div>
        )}
      </div>
    </div>
  );
}
