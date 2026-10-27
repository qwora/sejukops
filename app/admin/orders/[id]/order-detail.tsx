"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readDemoOrders } from "@/lib/demo-orders";
import type { ServiceOrder } from "@/lib/order-types";

export function OrderDetail({ orderNo }: { orderNo: string }) {
  const [order, setOrder] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    setOrder(readDemoOrders().find((item) => item.orderNo === orderNo) ?? null);
  }, [orderNo]);

  if (!order) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Order not found in the current demo workspace.</div>;
  }

  const whatsappMessage = encodeURIComponent(
    "Hi " + order.customerName + ",\n\nJob " + order.orderNo + " has been completed by Technician " + (order.assignedTechnician || "our team") + ". Please check and leave feedback. Thank you!"
  );
  const whatsappUrl = "https://wa.me/" + order.customerPhone + "?text=" + whatsappMessage;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/orders" className="text-sm font-semibold text-sea hover:underline">← Back to orders</Link>
        <span className="status-pill status-new">{order.status}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">{order.customerName}</h2>
            <p className="mt-1 text-sm text-slate-500">{order.customerPhone}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{order.address}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Problem description</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{order.problemDescription || "No problem description provided."}</p>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order summary</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Service</dt><dd className="text-right font-medium text-ink">{order.serviceType}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Branch</dt><dd className="text-right font-medium text-ink">{order.branch}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Technician</dt><dd className="text-right font-medium text-ink">{order.assignedTechnician || "Unassigned"}</dd></div>
              <div className="border-t border-slate-100 pt-3 flex justify-between gap-3"><dt className="font-semibold text-ink">Quoted price</dt><dd className="font-semibold text-ink">RM{order.quotedPrice.toFixed(2)}</dd></div>
            </dl>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block rounded-2xl bg-[#dff7eb] px-5 py-4 text-center text-sm font-semibold text-emerald-900 hover:bg-[#c7f0dd]">
            Open WhatsApp message
          </a>
        </aside>
      </div>
    </div>
  );
}
