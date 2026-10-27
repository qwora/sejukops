"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderNumber, readDemoOrders, saveDemoOrders } from "@/lib/demo-orders";
import { branchOptions, serviceOptions, technicianOptions, type ServiceOrder } from "@/lib/order-types";

export function NewOrderForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    problemDescription: "",
    serviceType: serviceOptions[0],
    quotedPrice: "",
    assignedTechnician: "",
    branch: branchOptions[0],
    adminNotes: ""
  });
  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.address || !form.quotedPrice) {
      setError("Please complete the customer name, phone, address and quoted price.");
      return;
    }

    const currentOrders = readDemoOrders();
    const orderNo = createOrderNumber(currentOrders);
    const newOrder: ServiceOrder = {
      id: orderNo.toLowerCase(),
      orderNo,
      customerName: form.customerName,
      customerPhone: form.customerPhone.replace(/[^0-9]/g, ""),
      address: form.address,
      problemDescription: form.problemDescription,
      serviceType: form.serviceType,
      quotedPrice: Number(form.quotedPrice),
      assignedTechnician: form.assignedTechnician,
      branch: form.branch,
      status: form.assignedTechnician ? "Assigned" : "New",
      adminNotes: form.adminNotes,
      createdAt: new Date().toISOString()
    };

    saveDemoOrders([newOrder, ...currentOrders]);
    router.push("/admin/orders/" + orderNo);
  }

  return (
    <form onSubmit={submitOrder} className="space-y-6">
      {error && <div role="alert" className="rounded-xl bg-rose px-4 py-3 text-sm font-medium text-red-800">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="font-semibold text-ink">Customer details</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-ink">Customer name<input required value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="e.g. Ahmad Rahman" /></label>
          <label className="text-sm font-medium text-ink">Phone number<input required value={form.customerPhone} onChange={(event) => updateField("customerPhone", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="e.g. 012-345 6789" /></label>
          <label className="text-sm font-medium text-ink md:col-span-2">Service address<textarea required value={form.address} onChange={(event) => updateField("address", event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="Full service address" /></label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="font-semibold text-ink">Service request</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-ink">Service type<select value={form.serviceType} onChange={(event) => updateField("serviceType", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100">{serviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-medium text-ink">Branch<select value={form.branch} onChange={(event) => updateField("branch", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100">{branchOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-medium text-ink">Quoted price (RM)<input required min="0" type="number" value={form.quotedPrice} onChange={(event) => updateField("quotedPrice", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="180" /></label>
          <label className="text-sm font-medium text-ink">Assign technician<select value={form.assignedTechnician} onChange={(event) => updateField("assignedTechnician", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100"><option value="">Leave unassigned</option>{technicianOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-medium text-ink md:col-span-2">Problem description<textarea value={form.problemDescription} onChange={(event) => updateField("problemDescription", event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="Describe the customer's issue" /></label>
          <label className="text-sm font-medium text-ink md:col-span-2">Admin notes<textarea value={form.adminNotes} onChange={(event) => updateField("adminNotes", event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="Internal notes only" /></label>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/orders")} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancel</button>
        <button type="submit" className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Create order</button>
      </div>
    </form>
  );
}
