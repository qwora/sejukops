"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCompletionToDb } from "@/lib/supabase/operations";
import type { ServiceOrder } from "@/lib/order-types";

type CompletionFormProps = { order: ServiceOrder };
const CURRENT_TECHNICIAN = "Ali";

export function CompletionForm({ order }: CompletionFormProps) {
  const router = useRouter();
  const [workDone, setWorkDone] = useState("");
  const [extraCharges, setExtraCharges] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Not recorded");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const finalAmount = order.quotedPrice + (Number(extraCharges) || 0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workDone.trim()) {
      setError("Please describe the work completed.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await saveCompletionToDb({
        orderNo: order.orderNo,
        technicianName: CURRENT_TECHNICIAN,
        workDone: workDone.trim(),
        extraCharges: Number(extraCharges) || 0,
        finalAmount,
        remarks: remarks.trim(),
        paymentAmount: Number(paymentAmount) || 0,
        paymentMethod,
        files
      });
      router.push("/technician/jobs/" + order.orderNo + "?completed=1");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the completion.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <div role="alert" className="rounded-xl bg-rose px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
      <label className="block text-sm font-medium text-ink">
        Work done
        <textarea required value={workDone} onChange={(event) => setWorkDone(event.target.value)} className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="What did you inspect, repair or clean?" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">Extra charges (RM)<input type="number" min="0" value={extraCharges} onChange={(event) => setExtraCharges(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" /></label>
        <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs uppercase tracking-wide text-slate-400">Final amount</p><p className="mt-1 text-xl font-semibold text-ink">RM{finalAmount.toFixed(2)}</p><p className="mt-1 text-xs text-slate-500">Quoted RM{order.quotedPrice.toFixed(2)} + extra charges</p></div>
      </div>

      <label className="block text-sm font-medium text-ink">
        Upload evidence
        <input type="file" multiple accept="image/*,video/*,.pdf" onChange={(event) => {
          const selected = Array.from(event.target.files ?? []).slice(0, 6);
          setFiles(selected);
          if ((event.target.files?.length ?? 0) > 6) setError("Only the first six files were added.");
        }} className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-600" />
        <span className="mt-2 block text-xs text-slate-400">{files.length}/6 files selected. Files will be saved to Supabase Storage.</span>
      </label>

      <label className="block text-sm font-medium text-ink">Remarks<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" placeholder="Optional customer or internal remarks" /></label>

      <section className="rounded-2xl border border-slate-200 p-4">
        <h3 className="font-semibold text-ink">Payment received (optional)</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">Amount (RM)<input type="number" min="0" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block text-sm font-medium text-ink">Method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sea focus:ring-2 focus:ring-blue-100"><option>Not recorded</option><option>Cash</option><option>Bank transfer</option><option>QR payment</option></select></label>
        </div>
      </section>

      <button disabled={saving} type="submit" className="w-full rounded-2xl bg-ink px-4 py-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{saving ? "Uploading and saving..." : "Mark job done"}</button>
    </form>
  );
}
