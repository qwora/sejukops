"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { CompletionForm } from "./completion-form";
import { ensureDemoData, getOrderByNumber } from "@/lib/supabase/operations";
import type { ServiceOrder } from "@/lib/order-types";

export default function TechnicianJobPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await ensureDemoData();
        const result = await getOrderByNumber(params.id);
        if (active) setOrder(result.order);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this job.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (params.id) load();
    return () => { active = false; };
  }, [params.id]);

  return (
    <PortalShell role="Technician" active="My jobs">
      <main className="mx-auto max-w-xl px-5 py-8">
        <Link href="/technician/jobs" className="text-sm font-semibold text-sea hover:underline">← Back to jobs</Link>
        {loading && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading job...</div>}
        {error && <div role="alert" className="mt-6 rounded-2xl bg-rose p-6 text-sm text-red-800">{error}</div>}
        {!loading && !error && !order && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Job not found.</div>}
        {order && (
          <>
            <header className="mt-6 rounded-3xl bg-ink p-6 text-white">
              <p className="text-sm font-semibold text-blue-200">{order.orderNo}</p>
              <h1 className="mt-3 text-2xl font-semibold">{order.serviceType}</h1>
              <p className="mt-1 text-white/65">{order.customerName}</p>
              <p className="mt-5 text-sm leading-6 text-white/75">{order.address}</p>
            </header>
            <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Job completion</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">Record what happened on site</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Final amount is calculated from the quoted price and any extra charges.</p>
              <div className="mt-6"><CompletionForm order={order} /></div>
            </section>
          </>
        )}
      </main>
    </PortalShell>
  );
}
