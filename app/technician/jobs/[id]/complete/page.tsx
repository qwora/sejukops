"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, FileText, Plus, Trash2, X } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { ErrorBanner, Skeleton, cx } from "@/components/ui/primitives";
import { getOrderBundle, uploadEvidence } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { useSession } from "@/lib/session";
import { formatDateTime, money } from "@/lib/format";
import { calculateFinalAmount, MAX_EVIDENCE_FILES, MAX_FILE_BYTES, MAX_JOB_BYTES } from "@/lib/workflow";
import { shrinkImage } from "@/lib/image";

export default function CompleteJobPage() {
  return (
    <MobileShell tabs={false}>
      <CompleteForm />
    </MobileShell>
  );
}

const WORK_CHIPS = ["Cleaned units", "Chemical wash", "Gas top-up", "Drain unblocked", "Replaced part", "Tested OK"];
const EXTRA_PRESETS = [
  { label: "Drain pipe flush", amount: 40 },
  { label: "Gas top-up (R32)", amount: 120 },
  { label: "Replace capacitor", amount: 120 },
  { label: "Extra unit cleaning", amount: 80 }
];
const PAYMENT = ["Cash", "QR payment", "Bank transfer", "Card", "Not paid"];

type Extra = { id: number; label: string; amount: string };
type Picked = { id: number; file: File; url: string };

function CompleteForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const { data: bundle, error, loading } = useLoad(() => getOrderBundle(id), [id]);

  const [chips, setChips] = useState<string[]>([]);
  const [workDone, setWorkDone] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [remarks, setRemarks] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [stage, setStage] = useState<"" | "uploading" | "saving">("");
  const [receipt, setReceipt] = useState<Picked | null>(null);
  const [preparing, setPreparing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);
  useEffect(() => () => { if (receipt) URL.revokeObjectURL(receipt.url); }, [receipt]);

  const extraTotal = useMemo(() => extras.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [extras]);
  const finalAmount = calculateFinalAmount(bundle?.order.quotedPrice ?? 0, extraTotal);
  const paid = payment === "Not paid" ? 0 : paidAmount === null ? finalAmount : Number(paidAmount) || 0;

  if (loading && !bundle) return <div className="space-y-3 p-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div>;
  if (error || !bundle) return <div className="p-4"><ErrorBanner message={error || "Job not found."} /></div>;
  const { order } = bundle;

  if (order.status !== "In Progress") {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-semibold text-ink">This job is {order.status.toLowerCase()}.</p>
        <Link href={"/technician/jobs/" + order.orderNo} className="mt-3 inline-block font-semibold text-brand">Back to job</Link>
      </div>
    );
  }

  function toggleChip(chip: string) {
    setChips((current) => (current.includes(chip) ? current.filter((c) => c !== chip) : [...current, chip]));
  }

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    if (inputRef.current) inputRef.current.value = "";
    setPreparing(true);
    const incoming = await Promise.all(picked.map(shrinkImage));
    setPreparing(false);
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_BYTES);
    const ok = incoming.filter((f) => f.size <= MAX_FILE_BYTES);
    const room = MAX_EVIDENCE_FILES - files.length;
    let used = files.reduce((sum, f) => sum + f.file.size, 0) + (receipt?.file.size ?? 0);
    const accepted: File[] = [];
    let overTotal = 0;
    for (const file of ok.slice(0, room)) {
      if (used + file.size > MAX_JOB_BYTES) { overTotal++; continue; }
      used += file.size;
      accepted.push(file);
    }
    setFiles((current) => [...current, ...accepted.map((file, i) => ({ id: Date.now() + i, file, url: URL.createObjectURL(file) }))]);
    if (tooBig.length) setFormError(`${tooBig.length} file(s) over 25 MB were skipped. Keep videos under 15 seconds.`);
    else if (overTotal) setFormError(`${overTotal} file(s) skipped: one job can hold up to 60 MB.`);
    else if (ok.length > room) setFormError(`Only ${MAX_EVIDENCE_FILES} files allowed. ${ok.length - room} not added.`);
    else setFormError("");
  }

  async function pickReceipt(list: FileList | null) {
    const picked = list?.[0];
    if (receiptRef.current) receiptRef.current.value = "";
    if (!picked) return;
    const file = await shrinkImage(picked);
    const used = files.reduce((sum, f) => sum + f.file.size, 0);
    if (file.size > MAX_FILE_BYTES) setFormError("Receipt is over 25 MB.");
    else if (used + file.size > MAX_JOB_BYTES) setFormError("Receipt skipped: one job can hold up to 60 MB.");
    else { setFormError(""); setReceipt({ id: Date.now(), file, url: URL.createObjectURL(file) }); }
  }

  function togglePreset(preset: { label: string; amount: number }) {
    setExtras((current) => {
      const exists = current.find((e) => e.label === preset.label);
      return exists ? current.filter((e) => e !== exists) : [...current, { id: Date.now(), label: preset.label, amount: String(preset.amount) }];
    });
  }

  async function submit() {
    if (submitted.current) return;
    const description = [chips.join(", "), workDone.trim()].filter(Boolean).join(". ");
    if (!description) {
      setFormError("Pick what you did or write a short note.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (extras.some((e) => !e.label.trim() || !(Number(e.amount) > 0))) {
      setFormError("Each extra charge needs a name and an amount.");
      return;
    }
    submitted.current = true;
    setFormError("");
    try {
      const withReceipt = receipt && payment !== "Not paid";
      setStage(files.length || withReceipt ? "uploading" : "saving");
      const uploaded = files.length ? await uploadEvidence(order.orderNo, files.map((f) => f.file)) : [];
      const receiptFile = withReceipt ? (await uploadEvidence(order.orderNo, [new File([receipt.file], "receipt-" + receipt.file.name, { type: receipt.file.type })]))[0] : null;
      setStage("saving");
      await apiPost(`/api/orders/${order.orderNo}/complete`, {
        workDone: description,
        extraItems: extras.map((e) => ({ label: e.label.trim(), amount: Number(e.amount) })),
        remarks: remarks.trim(),
        paymentAmount: paid,
        paymentMethod: payment === "Not paid" ? "Not recorded" : payment,
        files: uploaded,
        receipt: receiptFile
      });
      router.replace(`/technician/jobs/${order.orderNo}/success`);
    } catch (err) {
      submitted.current = false;
      setStage("");
      setFormError(err instanceof Error ? err.message : "Could not save. Check your connection and try again.");
    }
  }

  const section = "rounded-3xl border border-line bg-white px-4 py-3.5";
  const chipBase = "h-9 rounded-full px-3.5 text-[13px] font-semibold transition";

  return (
    <div className="flex min-h-screen flex-col lg:min-h-[calc(100vh-48px)]">
      <div className="sticky top-0 z-10 flex min-h-[60px] items-center gap-2 border-b border-line bg-white/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur">
        <Link href={"/technician/jobs/" + order.orderNo} aria-label="Back" className="flex h-11 w-11 items-center justify-center text-ink"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-light tracking-tight text-ink">Complete job</h1>
          <p className="num text-xs text-ink-muted">{order.orderNo} · {session.technicianName ?? order.assignedTechnician} · {formatDateTime(new Date().toISOString())}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {formError && <ErrorBanner message={formError} />}

        <section className={section}>
          <h2 className="text-[15px] font-normal text-ink">Work done</h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {WORK_CHIPS.map((chip) => (
              <button key={chip} type="button" aria-pressed={chips.includes(chip)} onClick={() => toggleChip(chip)} className={cx(chipBase, chips.includes(chip) ? "bg-brand-tint text-brand-ink shadow-[inset_0_0_0_1.5px_#2E7BAA]" : "bg-rail text-ink-2")}>
                {chip}
              </button>
            ))}
          </div>
          <label className="mt-2.5 block">
            <span className="sr-only">Work notes</span>
            <textarea rows={2} value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="Add details, e.g. 2 units, unblocked living room drain" className="m-field resize-none py-2.5 text-[14px]" />
          </label>
        </section>

        <section className={section}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-normal text-ink">Photos, video &amp; PDF</h2>
            <span className="num text-xs font-semibold text-ink-muted">{files.length} / {MAX_EVIDENCE_FILES}</span>
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {files.map((item) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-2xl bg-[#E1E8ED]">
                {item.file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center text-[10px] font-semibold text-[#26475A]"><FileText className="h-5 w-5" /><span className="line-clamp-2 break-all">{item.file.name}</span></span>
                )}
                <button type="button" onClick={() => setFiles((current) => current.filter((f) => f.id !== item.id))} aria-label={"Remove " + item.file.name} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {files.length < MAX_EVIDENCE_FILES && (
              <button type="button" onClick={() => inputRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] border-dashed border-[#9FC3DA] bg-[#EEF5FA] text-[11px] font-bold text-brand">
                <Plus className="h-5 w-5" strokeWidth={2.4} />Add
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" multiple accept="image/*,video/*,application/pdf" className="sr-only" onChange={(e) => addFiles(e.target.files)} aria-label="Add evidence files" />
          <p className="mt-2 text-xs text-ink-faint">{preparing ? "Preparing photos…" : "Add before and after photos. Jobs without photos are flagged for the manager. Videos up to 25 MB (about 15 seconds)."}</p>
        </section>

        <section className={section}>
          <h2 className="text-[15px] font-normal text-ink">Extra charges</h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {EXTRA_PRESETS.map((preset) => {
              const on = extras.some((e) => e.label === preset.label);
              return (
                <button key={preset.label} type="button" aria-pressed={on} onClick={() => togglePreset(preset)} className={cx(chipBase, "flex items-center gap-1", on ? "bg-ink text-white" : "bg-rail text-ink-2")}>
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}{preset.label} <span className="num opacity-70">+{preset.amount}</span>
                </button>
              );
            })}
          </div>
          {extras.length > 0 && (
            <ul className="mt-3 space-y-2">
              {extras.map((extra) => (
                <li key={extra.id} className="flex items-center gap-2">
                  <input aria-label="Extra charge name" value={extra.label} onChange={(e) => setExtras((c) => c.map((x) => (x.id === extra.id ? { ...x, label: e.target.value } : x)))} className="m-field h-11 flex-1 text-sm" />
                  <div className="flex h-11 w-[104px] items-center rounded-full border border-line bg-white px-2.5 focus-within:border-brand">
                    <span className="text-xs text-ink-muted">RM</span>
                    <input aria-label="Amount" inputMode="decimal" value={extra.amount} onChange={(e) => setExtras((c) => c.map((x) => (x.id === extra.id ? { ...x, amount: e.target.value.replace(/[^\d.]/g, "") } : x)))} className="num w-full bg-transparent pl-1.5 text-right text-sm font-semibold outline-none" />
                  </div>
                  <button type="button" onClick={() => setExtras((c) => c.filter((x) => x.id !== extra.id))} aria-label="Remove extra charge" className="flex h-11 w-9 items-center justify-center text-ink-faint"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setExtras((c) => [...c, { id: Date.now(), label: "", amount: "" }])} className="mt-2.5 flex h-10 items-center gap-1.5 text-[13px] font-medium text-brand">
            <Plus className="h-4 w-4" />Add other charge
          </button>
        </section>

        <section className={section}>
          <h2 className="text-[15px] font-normal text-ink">Payment received</h2>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {PAYMENT.map((method) => (
              <button key={method} type="button" aria-pressed={payment === method} onClick={() => setPayment(method)} className={cx("h-11 rounded-full text-[13px] font-medium transition", payment === method ? "bg-ink text-white" : "bg-rail text-ink-2")}>
                {method}
              </button>
            ))}
          </div>
          {payment !== "Not paid" && (
            <label className="mt-2.5 flex items-center justify-between gap-3 text-[13px] text-ink-muted">
              Amount received
              <span className="flex h-11 w-[140px] items-center rounded-full border border-line bg-white px-3 focus-within:border-brand">
                <span className="text-xs">RM</span>
                <input inputMode="decimal" value={paidAmount ?? finalAmount.toFixed(2)} onChange={(e) => setPaidAmount(e.target.value.replace(/[^\d.]/g, ""))} className="num w-full bg-transparent pl-1.5 text-right text-[15px] font-bold text-ink outline-none" />
              </span>
            </label>
          )}
          {payment !== "Not paid" && (
            <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
              {receipt ? (
                <div className="relative h-14 w-14 flex-none overflow-hidden rounded-2xl bg-[#E1E8ED]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={receipt.url} alt="Payment receipt" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setReceipt(null)} aria-label="Remove receipt" className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => receiptRef.current?.click()} className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#9FC3DA] bg-[#EEF5FA] text-brand" aria-label="Add receipt photo">
                  <Camera className="h-5 w-5" />
                </button>
              )}
              <div className="text-[13px] leading-snug">
                <p className="font-semibold text-ink">Receipt photo <span className="font-normal text-ink-faint">(optional)</span></p>
                <p className="text-xs text-ink-muted">{receipt ? receipt.file.name : "Transfer slip, QR screenshot or signed receipt"}</p>
              </div>
              <input ref={receiptRef} type="file" accept="image/*,application/pdf" className="sr-only" aria-label="Receipt photo" onChange={(e) => pickReceipt(e.target.files)} />
            </div>
          )}
        </section>

        <section className={section}>
          <label className="block">
            <span className="text-[15px] font-normal text-ink">Remarks <span className="font-normal text-ink-faint">(optional)</span></span>
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Anything the manager or customer should know" className="m-field mt-2 resize-none py-2.5 text-[14px]" />
          </label>
        </section>
      </div>

      <div className="sticky bottom-0 z-20 flex flex-col gap-3 rounded-t-[28px] bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3.5 shadow-sheet">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-ink-muted">Final amount</p>
            <p className="num text-xs text-ink-faint">Quoted {money(order.quotedPrice, 0)}{extraTotal > 0 ? " + extras " + money(extraTotal, 0) : ""}</p>
          </div>
          <p className="num text-[32px] font-extralight tracking-tight text-ink">{money(finalAmount)}</p>
        </div>
        <button onClick={submit} disabled={!!stage || preparing} className="flex h-14 items-center justify-center rounded-full bg-brand text-base font-medium text-white shadow-cta transition active:scale-[.99] disabled:opacity-70">
          {stage === "uploading" ? `Uploading ${files.length} file${files.length === 1 ? "" : "s"}…` : stage === "saving" ? "Saving…" : "Mark job done"}
        </button>
      </div>
    </div>
  );
}
