"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Bell, Check, MessageCircle } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { ErrorBanner, Skeleton } from "@/components/ui/primitives";
import { getOrderBundle } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { formatTime, money } from "@/lib/format";
import { jobDoneMessage, waLink } from "@/lib/whatsapp";

export default function JobDonePage() {
  return (
    <MobileShell tabs={false}>
      <Done />
    </MobileShell>
  );
}

function Done() {
  const { id } = useParams<{ id: string }>();
  const { data: bundle, error, loading } = useLoad(() => getOrderBundle(id), [id]);
  const [sent, setSent] = useState(false);

  if (loading && !bundle) return <div className="space-y-3 p-4"><Skeleton className="h-52 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div>;
  if (error || !bundle) return <div className="p-4"><ErrorBanner message={error || "Job not found."} /></div>;

  const { order, completion, notifications } = bundle;
  const customerMsg = notifications.find((n) => n.event === "job_done" && n.audience === "customer");
  const managerMsg = notifications.find((n) => n.event === "job_done" && n.channel === "internal");
  const completedAt = completion?.completedAt ?? new Date().toISOString();
  const message = customerMsg?.message ?? jobDoneMessage({ customerName: order.customerName, orderNo: order.orderNo, technicianName: order.assignedTechnician, completedAt });
  const link = customerMsg?.link ?? waLink(order.customerPhone, message);
  const extras = completion?.extraItems ?? [];

  function markSent() {
    setSent(true);
    if (customerMsg && customerMsg.status === "ready") apiPost("/api/notifications/" + customerMsg.id, { status: "sent" }).catch(() => undefined);
  }

  return (
    <div className="flex min-h-screen flex-col lg:min-h-[calc(100vh-48px)]">
      <div className="relative flex flex-col items-center gap-3 overflow-hidden bg-brand-sky px-6 pb-[72px] pt-10 text-center text-white">
        <span className="pointer-events-none absolute -top-[120px] h-[360px] w-[360px] rounded-full border border-white/10" aria-hidden />
        <span className="pointer-events-none absolute -top-[60px] h-[240px] w-[240px] rounded-full border border-white/15" aria-hidden />
        <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-[0_0_0_10px_rgba(255,255,255,.15)] animate-fade-up">
          <Check className="h-9 w-9 text-brand" strokeWidth={3} />
        </span>
        <h1 className="relative mt-2 text-[34px] font-extralight tracking-tight">Job done</h1>
        <p className="num relative text-sm text-white/85">{order.orderNo} · completed {formatTime(completedAt)}</p>
      </div>

      <div className="relative mx-4 -mt-12 rounded-[28px] bg-white p-4 shadow-lift">
        <div className="flex justify-between py-1.5 text-[13.5px]"><span className="text-ink-muted">Customer</span><span className="font-semibold text-ink">{order.customerName}</span></div>
        <div className="flex justify-between py-1.5 text-[13.5px]"><span className="text-ink-muted">{order.serviceType}</span><span className="num">{money(order.quotedPrice)}</span></div>
        {extras.map((item, i) => (
          <div key={i} className="flex justify-between py-1.5 text-[13.5px]"><span className="text-ink-muted">{item.label}</span><span className="num">{money(item.amount)}</span></div>
        ))}
        <div className="mt-1.5 flex justify-between border-t border-dashed border-line-strong pt-3 text-base font-medium text-ink">
          <span>{completion && completion.paymentAmount > 0 ? "Collected" : "Final amount"}</span>
          <span className="num">{money(completion?.paymentAmount || completion?.finalAmount || order.quotedPrice)}</span>
        </div>
        {completion && (
          <p className="mt-2 text-xs text-ink-muted">
            {completion.paymentAmount > 0 && <span className="mr-2 rounded-full bg-st-asg-bg px-2 py-0.5 text-[11px] font-semibold text-st-asg-fg">{completion.paymentMethod}</span>}
            {completion.files.length} evidence {completion.files.length === 1 ? "file" : "files"}{completion.receipt ? " · receipt" : ""} attached
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center gap-3 rounded-3xl border border-line bg-white px-3.5 py-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-st-rev-bg text-ai"><Bell className="h-[18px] w-[18px]" /></span>
          <div className="flex-1 text-[13px] leading-snug">
            <b className="text-ink">Manager &amp; accounts notified</b>
            <br />
            <span className="text-ink-muted">{managerMsg ? "Ready for review in the manager queue" : "The job is now in the review queue"}</span>
          </div>
          <Check className="h-[18px] w-[18px] text-brand" strokeWidth={2.6} />
        </div>

        <div className="flex flex-col gap-2.5 rounded-3xl border border-line bg-white p-3.5">
          <p className="eyebrow text-ink-muted">Customer feedback message</p>
          <p className="max-w-[92%] whitespace-pre-line rounded-[4px_14px_14px_14px] bg-[#DCF8C6] px-3 py-2.5 text-[13px] leading-relaxed text-[#12301F]">{message}</p>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 px-4 pb-6">
        <a href={link} target="_blank" rel="noreferrer" onClick={markSent} className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-whatsapp text-base font-semibold text-[#08361C]">
          <MessageCircle className="h-5 w-5" />{sent || customerMsg?.status === "sent" ? "Open WhatsApp again" : "Send on WhatsApp"}
        </a>
        <Link href="/technician/jobs" className="flex h-12 items-center justify-center rounded-full text-[15px] font-normal text-ink">Back to today&apos;s jobs</Link>
      </div>
    </div>
  );
}
