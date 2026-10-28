"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, ClipboardCheck, ImageOff, Sparkles } from "lucide-react";
import { DesktopShell, PageHeader } from "@/components/shell/desktop-shell";
import { Avatar, Badge, Button, EmptyState, ErrorBanner, Notice, PageLoading, Stat, StatusPill } from "@/components/ui/primitives";
import { listCompletions, listOrders } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { formatDateTime, money, timeAgo } from "@/lib/format";
import { supervisorFlags } from "@/lib/supervisor";

export default function ReviewQueuePage() {
  return (
    <DesktopShell roles={["manager", "admin"]}>
      <Queue />
    </DesktopShell>
  );
}

function Queue() {
  const { data, error, loading, reload } = useLoad(async () => {
    const [orders, completions] = await Promise.all([listOrders(), listCompletions()]);
    return { orders, completions };
  });
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const rows = useMemo(() => {
    if (!data) return { review: [], approved: [] };
    const withCompletion = (status: string) =>
      data.orders
        .filter((o) => o.status === status)
        .map((order) => {
          const completion = data.completions.find((c) => c.orderNo === order.orderNo) ?? null;
          return { order, completion, flags: supervisorFlags(order, completion) };
        })
        // Newest first by default; the manager can switch to oldest first.
        .sort((a, b) => {
          const byTime = (a.completion?.completedAt ?? "").localeCompare(b.completion?.completedAt ?? "");
          return sort === "oldest" ? byTime : -byTime;
        });
    return { review: withCompletion("Job Done"), approved: withCompletion("Reviewed") };
  }, [data, sort]);

  const waitingValue = rows.review.reduce((sum, r) => sum + (r.completion?.finalAmount ?? 0), 0);
  const flagged = rows.review.filter((r) => r.flags.length).length;
  const oldest = rows.review.map((r) => r.completion?.completedAt).filter(Boolean).sort()[0];
  const shown = flaggedOnly ? rows.review.filter((r) => r.flags.length) : rows.review;

  async function close(orderNo: string) {
    setBusy(orderNo);
    setActionError("");
    try {
      await apiPost(`/api/orders/${orderNo}/action`, { action: "close" });
      setNotice(orderNo + " closed.");
      await reload(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not close.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4">
      <PageHeader title="Review queue" subtitle="Approve completed work, return corrections, then close." />
      {error && <ErrorBanner message={"Could not load the queue: " + error} onRetry={() => reload()} />}
      {notice && <Notice>{notice}</Notice>}
      {actionError && <ErrorBanner message={actionError} />}
      {loading && !data && <PageLoading />}

      {data && (
        <>
          <div className="card grid grid-cols-2 gap-px overflow-hidden bg-rail md:grid-cols-4 [&>*]:bg-white">
            <Stat label="Waiting for review" value={rows.review.length} />
            <Stat label="Value waiting" value={money(waitingValue, 0)} />
            <Stat label="Flagged by supervisor" value={flagged} tone={flagged ? "danger" : undefined} />
            <Stat label="Oldest waiting" value={oldest ? timeAgo(oldest) : "—"} />
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Needs review</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-pressed={flaggedOnly}
                  onClick={() => setFlaggedOnly((value) => !value)}
                  className={"h-7 rounded-md px-2.5 text-xs font-medium transition " + (flaggedOnly ? "bg-navy text-white" : "bg-rail text-ink-2 hover:text-ink")}
                >
                  Flagged only{flagged ? ` (${flagged})` : ""}
                </button>
                <div role="group" aria-label="Sort" className="flex rounded-md bg-rail p-0.5 text-xs font-medium">
                  {(["newest", "oldest"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={sort === option}
                      onClick={() => setSort(option)}
                      className={"h-6 rounded px-2.5 transition " + (sort === option ? "bg-white text-ink shadow-sec" : "text-ink-muted hover:text-ink")}
                    >
                      {option === "newest" ? "Newest first" : "Oldest first"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {rows.review.length === 0 ? (
              <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="All caught up" body="No completed jobs are waiting for review." />
            ) : shown.length === 0 ? (
              <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="No flagged jobs" body="Every job waiting for review passed the supervisor checks." />
            ) : (
              <ul>
                {shown.map(({ order, completion, flags }) => {
                  const diff = (completion?.finalAmount ?? order.quotedPrice) - order.quotedPrice;
                  return (
                    <li key={order.id}>
                      <Link href={"/manager/reviews/" + order.orderNo} className="group flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 hover:bg-[#F7FAFC]">
                        <Avatar name={order.assignedTechnician} size={32} />
                        <div className="min-w-[220px] flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="num text-[13px] font-semibold text-ink">{order.orderNo}</span>
                            <span className="text-[13px] text-ink-2">{order.serviceType} · {order.customerName}</span>
                          </div>
                          <div className="mt-0.5 text-xs text-ink-muted">
                            {order.assignedTechnician} · done {completion ? formatDateTime(completion.completedAt) : "—"} · {completion?.files.length ?? 0} files
                          </div>
                          {flags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {flags.map((flag) => (
                                <Badge key={flag.code} tone={flag.level === "high" ? "danger" : flag.level === "medium" ? "warn" : "neutral"}>
                                  {flag.code === "no_evidence" ? <ImageOff className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}{flag.title}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="num text-sm font-bold text-ink">{money(completion?.finalAmount ?? order.quotedPrice)}</div>
                          <div className={"num text-xs " + (diff > 0 ? "font-semibold text-warn" : "text-ink-muted")}>{diff > 0 ? "+" + money(diff, 0) + " vs quote" : "matches quote"}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-ink-faint group-hover:text-ink" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {rows.approved.length > 0 && (
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Approved · ready to close</h2>
                <span className="text-xs text-ink-muted">{rows.approved.length} jobs</span>
              </div>
              <ul>
                {rows.approved.map(({ order, completion }) => (
                  <li key={order.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
                    <Link href={"/manager/reviews/" + order.orderNo} className="num text-[13px] font-semibold text-ink hover:underline">{order.orderNo}</Link>
                    <span className="flex-1 text-[13px] text-ink-2">{order.serviceType} · {order.assignedTechnician}</span>
                    <StatusPill status={order.status} />
                    <span className="num w-24 text-right text-[13px] font-semibold">{money(completion?.finalAmount ?? order.quotedPrice)}</span>
                    <Button size="sm" variant="primary" loading={busy === order.orderNo} onClick={() => close(order.orderNo)}>Close</Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
