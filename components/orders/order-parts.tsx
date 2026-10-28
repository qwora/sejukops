"use client";

import { useEffect, useState } from "react";
import { Check, FileText, MessageCircle, Phone, PlayCircle } from "lucide-react";
import { apiPost } from "@/lib/api";
import { signedEvidenceUrls } from "@/lib/data";
import { formatDateTime, money, timeAgo } from "@/lib/format";
import { formatMyPhone } from "@/lib/phone";
import type { ActivityEntry, AppNotification, ServiceCompletion, ServiceOrder } from "@/lib/order-types";
import { Badge, Card, cx } from "@/components/ui/primitives";

const ACTION_TEXT: Record<string, string> = {
  order_created: "Order created",
  assign: "Technician assigned",
  reassign: "Technician reassigned",
  reschedule: "Rescheduled",
  start: "Job started",
  decline: "Declined by technician",
  complete: "Job marked done",
  job_completed: "Job marked done",
  approve: "Reviewed and approved",
  return: "Returned to technician",
  close: "Order closed",
  whatsapp_sent: "WhatsApp message sent"
};

const ACTION_DOT: Record<string, string> = {
  complete: "#0B6E4F", job_completed: "#0B6E4F", approve: "#5E35B1", return: "#B42318", decline: "#B42318", start: "#C2620A",
  assign: "#0E7490", reassign: "#0E7490", whatsapp_sent: "#25D366", close: "#01202F", reschedule: "#C2620A"
};

export function ActivityTimeline({ entries, order }: { entries: ActivityEntry[]; order: ServiceOrder }) {
  const list = entries.length ? entries : [{ id: "created", action: "order_created", previousStatus: null, newStatus: "New" as const, actor: "Admin", note: "", createdAt: order.createdAt }];
  return (
    <Card title="Activity">
      <ol className="relative flex flex-col gap-3.5">
        <span className="absolute bottom-2 left-[3.5px] top-2 w-px bg-line" aria-hidden />
        {list.map((entry) => (
          <li key={entry.id} className="relative flex gap-3">
            <span className="relative z-10 mt-[5px] h-2 w-2 flex-none rounded-full ring-2 ring-white" style={{ background: ACTION_DOT[entry.action] ?? "#8AA2B0" }} aria-hidden />
            <div className="text-[12.5px] leading-snug">
              <div className="text-ink">{ACTION_TEXT[entry.action] ?? entry.action}<span className="text-ink-muted"> · {entry.actor}</span></div>
              {entry.note && <div className="mt-0.5 text-ink-muted">“{entry.note}”</div>}
              <div className="num text-ink-faint">{formatDateTime(entry.createdAt)}</div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function CustomerCard({ order }: { order: ServiceOrder }) {
  return (
    <Card title="Customer">
      <div className="text-[13px] leading-relaxed">
        <div className="font-semibold text-ink">{order.customerName}</div>
        <div className="num text-ink-muted">{formatMyPhone(order.customerPhone)}</div>
        <div className="mt-1 text-ink-2">{order.address}</div>
      </div>
      <div className="flex gap-2">
        <a href={"tel:+" + order.customerPhone} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-medium text-ink shadow-sec"><Phone className="h-3.5 w-3.5" />Call</a>
        <a href={"https://wa.me/" + order.customerPhone} target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-ok-tint text-[13px] font-medium text-ok"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
      </div>
    </Card>
  );
}

const AUDIENCE: Record<string, string> = { customer: "Customer", technician: "Technician", manager: "Manager", admin: "Admin" };
const EVENT: Record<string, string> = { job_done: "Job done", job_assigned: "New job", job_returned: "Job returned" };

export function WhatsAppMessages({ notifications, onSent }: { notifications: AppNotification[]; onSent?: () => void }) {
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const items = notifications.filter((n) => n.channel === "whatsapp");
  const internal = notifications.filter((n) => n.channel === "internal");

  function mark(item: AppNotification) {
    setSent((current) => ({ ...current, [item.id]: true }));
    apiPost("/api/notifications/" + item.id, { status: "sent" }).then(() => onSent?.()).catch(() => undefined);
  }

  return (
    <Card title="Notifications" action={<span className="hint">{items.length} WhatsApp · {internal.length} internal</span>}>
      {notifications.length === 0 && <p className="text-[13px] text-ink-muted">Messages appear here when a technician is assigned or the job is done.</p>}
      {items.map((item) => {
        const isSent = item.status !== "ready" || sent[item.id];
        return (
          <div key={item.id} className="rounded-[10px] border border-line p-3">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <Badge tone={isSent ? "neutral" : "brand"}>{isSent ? "Sent" : "Ready"}</Badge>
              <span className="font-semibold text-ink">{EVENT[item.event] ?? item.event} → {AUDIENCE[item.audience]}</span>
              <span className="ml-auto text-ink-faint">{timeAgo(item.createdAt)}</span>
            </div>
            <p className="whitespace-pre-line [overflow-wrap:anywhere] rounded-lg rounded-tl-sm bg-[#DCF8C6] px-3 py-2 text-[12.5px] leading-relaxed text-[#12301F]">{item.message}</p>
            {item.link && (
              <a href={item.link} target="_blank" rel="noreferrer" onClick={() => mark(item)} className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-whatsapp text-[13px] font-semibold text-whatsapp-ink hover:brightness-95">
                <MessageCircle className="h-4 w-4" />{isSent ? "Open again in WhatsApp" : "Send on WhatsApp"}
              </a>
            )}
          </div>
        );
      })}
      {internal.map((item) => (
        <div key={item.id} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
          <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-ai" />
          <span><span className="font-medium text-ink-2">{item.audience === "admin" ? "Admin" : "Manager"} notified:</span> {item.message}</span>
        </div>
      ))}
    </Card>
  );
}

export function EvidenceGrid({ completion }: { completion: ServiceCompletion }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!completion.files.length) return;
    signedEvidenceUrls(completion.files.map((f) => f.path)).then(setUrls).catch(() => setFailed(true));
  }, [completion.files]);

  if (!completion.files.length) {
    return <div className="rounded-[10px] border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-muted">No photos, videos or documents were uploaded.</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {completion.files.map((file) => {
        const url = urls[file.path];
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        return (
          <a key={file.path} href={url} target="_blank" rel="noreferrer" title={file.name} className={cx("group relative block aspect-square overflow-hidden rounded-[10px] bg-gradient-to-br from-[#DCE7EE] to-[#C3D3DE]", !url && "pointer-events-none")}>
            {url && isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={file.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
            )}
            {(!isImage || !url) && (
              <span className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-[11px] font-semibold text-[#26475A]">
                {isVideo ? <PlayCircle className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                <span className="line-clamp-2 break-all">{failed ? "Preview unavailable" : file.name}</span>
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}

export function AmountBreakdown({ order, completion }: { order: ServiceOrder; completion: ServiceCompletion | null }) {
  const extras = completion?.extraItems.length ? completion.extraItems : completion?.extraCharges ? [{ label: "Extra charges", amount: completion.extraCharges }] : [];
  const final = completion?.finalAmount ?? order.quotedPrice;
  const diff = final - order.quotedPrice;
  return (
    <Card title="Amount">
      <div className="text-[13px]">
        <div className="flex justify-between py-1"><span className="text-ink-muted">Quoted · {order.serviceType}</span><span className="num">{money(order.quotedPrice)}</span></div>
        {extras.map((item, i) => (
          <div key={i} className="flex justify-between py-1"><span className="text-ink-muted">{item.label}</span><span className="num">+{money(item.amount)}</span></div>
        ))}
        <div className="mt-1.5 flex items-baseline justify-between border-t border-line pt-2.5 text-[15px] font-bold text-ink">
          <span>Final</span><span className="num">{money(final)}</span>
        </div>
        {completion && diff > 0 && <div className="num text-right text-xs font-semibold text-warn">+{Math.round((diff / (order.quotedPrice || 1)) * 100)}% vs quote</div>}
        {completion && (
          <div className="mt-2 flex justify-between py-1">
            <span className="text-ink-muted">Received</span>
            <span className={cx("num font-semibold", completion.paymentAmount >= final ? "text-ok" : completion.paymentAmount > 0 ? "text-warn" : "text-ink-muted")}>
              {completion.paymentAmount > 0 ? money(completion.paymentAmount) + " · " + completion.paymentMethod : "Not recorded"}
            </span>
          </div>
        )}
        {completion?.receipt && <ReceiptLink path={completion.receipt.path} />}
      </div>
    </Card>
  );
}

function ReceiptLink({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    signedEvidenceUrls([path]).then((urls) => setUrl(urls[path] ?? "")).catch(() => undefined);
  }, [path]);
  return (
    <a href={url || undefined} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2.5 rounded-[10px] border border-line p-2 text-[12.5px] font-semibold text-ink-2 hover:bg-[#F7FAFC]">
      <span className="h-10 w-10 flex-none overflow-hidden rounded-md bg-rail">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt="Payment receipt" className="h-full w-full object-cover" />}
      </span>
      Payment receipt photo →
    </a>
  );
}
