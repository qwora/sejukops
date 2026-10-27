"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, MessageCircle } from "lucide-react";
import { listNotifications } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { AppNotification } from "@/lib/order-types";
import { cx } from "@/components/ui/primitives";

const eventLabel: Record<string, string> = {
  job_done: "Job done",
  job_assigned: "Job assigned",
  job_returned: "Job returned"
};

export function NotificationBell({ orderHref }: { orderHref: (orderNo: string) => string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    listNotifications(15).then((data) => { setItems(data); setError(false); }).catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const esc = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const unread = items.filter((item) => item.status === "ready").length;

  async function markSent(item: AppNotification) {
    setItems((current) => current.map((n) => (n.id === item.id ? { ...n, status: "sent" } : n)));
    apiPost("/api/notifications/" + item.id, { status: item.channel === "whatsapp" ? "sent" : "read" }).catch(() => undefined);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={`Notifications${unread ? `, ${unread} new` : ""}`}
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); if (!open) load(); }}
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#303030] text-[#E3E3E3] hover:bg-[#3A3A3A]"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unread > 0 && <span className="absolute right-[7px] top-1.5 h-2 w-2 rounded-full bg-brand-glow ring-2 ring-[#303030]" />}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,.18)] ring-1 ring-black/5 animate-fade-up">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            <span className="text-xs text-ink-muted">{unread} need action</span>
          </div>
          <ul className="max-h-[420px] overflow-y-auto">
            {error && <li className="px-4 py-6 text-center text-[13px] text-danger">Could not load notifications.</li>}
            {!error && items.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-ink-muted">Nothing yet. Completed jobs show up here.</li>}
            {items.map((item) => (
              <li key={item.id} className={cx("flex gap-3 border-b border-[#F4F4F4] px-4 py-3", item.status === "ready" && "bg-[#FAFFFC]")}>
                <span className={cx("mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg", item.channel === "whatsapp" ? "bg-[#DCF8C6] text-[#128C4B]" : "bg-ai-tint text-ai")}>
                  {item.channel === "whatsapp" ? <MessageCircle className="h-3.5 w-3.5" aria-hidden /> : <Bell className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <span className="font-semibold text-ink">{eventLabel[item.event] ?? item.event}</span>
                    <Link href={orderHref(item.orderNo)} onClick={() => setOpen(false)} className="num font-medium text-ink-muted hover:text-ink hover:underline">{item.orderNo}</Link>
                    <span className="ml-auto text-[11px] text-ink-faint">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-[12.5px] text-ink-muted">
                    {item.channel === "whatsapp" ? `WhatsApp to ${item.audience}: ` : ""}
                    {item.message.split("\n")[0]}
                  </p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" onClick={() => markSent(item)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover">
                      {item.status === "ready" ? "Send on WhatsApp" : "Sent · open again"} →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
