"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CornerUpLeft, ShieldCheck, Sparkles } from "lucide-react";
import { DesktopShell, PageHeader } from "@/components/shell/desktop-shell";
import { Badge, Button, Card, cx, EmptyState, ErrorBanner, LinkButton, Notice, PageLoading, StatusPill, StatusStepper } from "@/components/ui/primitives";
import { ActivityTimeline, AmountBreakdown, CustomerCard, EvidenceGrid, WhatsAppMessages } from "@/components/orders/order-parts";
import { getOrderBundle } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { formatDateTime, formatTime } from "@/lib/format";
import { supervisorFlags } from "@/lib/supervisor";

export default function ReviewDetailPage() {
  return (
    <DesktopShell roles={["manager", "admin"]}>
      <ReviewDetail />
    </DesktopShell>
  );
}

function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: bundle, error, loading, reload } = useLoad(() => getOrderBundle(id), [id]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  if (loading && !bundle) return <div className="mx-auto max-w-[1080px]"><PageLoading rows={6} /></div>;
  if (error) return <div className="mx-auto max-w-[1080px]"><ErrorBanner message={error} onRetry={() => reload()} /></div>;
  if (!bundle) return <div className="card mx-auto max-w-[1080px]"><EmptyState title="Order not found" action={<LinkButton href="/manager/reviews">Back to queue</LinkButton>} /></div>;

  const { order, completion, activity, notifications, review } = bundle;
  const flags = supervisorFlags(order, completion);
  const canReview = order.status === "Job Done";
  const minutes = completion && order.scheduledAt ? Math.round((new Date(completion.completedAt).getTime() - new Date(order.scheduledAt).getTime()) / 60000) : null;

  async function act(action: "approve" | "return" | "close") {
    if (action === "return" && !notes.trim()) {
      setActionError("Add a note so the technician knows what to fix.");
      return;
    }
    setBusy(action);
    setActionError("");
    try {
      await apiPost(`/api/orders/${order.orderNo}/action`, { action, notes: notes.trim() });
      setNotice(action === "approve" ? "Approved. The order is ready to close." : action === "return" ? "Returned to " + order.assignedTechnician + ". A WhatsApp message is ready." : "Order closed.");
      setNotes("");
      await reload(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4">
      <PageHeader
        back="/manager/reviews"
        title={<span className="num">{order.orderNo}</span>}
        meta={
          <>
            <StatusPill status={order.status} />
            {completion && completion.paymentAmount > 0 && <Badge tone="blue">Paid · {completion.paymentMethod}</Badge>}
          </>
        }
        subtitle={completion ? `Completed ${formatDateTime(completion.completedAt)} by ${completion.technicianName}` : "Not completed yet"}
        actions={
          <>
            {canReview && <Button icon={<CornerUpLeft className="h-4 w-4" />} loading={busy === "return"} onClick={() => act("return")}>Return to technician</Button>}
            {canReview && <Button variant="primary" icon={<ShieldCheck className="h-4 w-4" />} loading={busy === "approve"} onClick={() => act("approve")}>Mark as reviewed</Button>}
            {order.status === "Reviewed" && <Button variant="primary" loading={busy === "close"} onClick={() => act("close")}>Close order</Button>}
          </>
        }
      />
      {notice && <Notice>{notice}</Notice>}
      {actionError && <ErrorBanner message={actionError} />}

      <StatusStepper status={order.status} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          {completion && (
            <section className={cx("flex flex-col gap-3 rounded-xl p-4", flags.length ? "bg-ai-tint shadow-[0_0_0_1px_#E2D5FA]" : "bg-brand-tint shadow-[0_0_0_1px_#BFE6D3]")}>
              <div className="flex items-center gap-2">
                {flags.length ? <Sparkles className="h-[18px] w-[18px] text-ai" /> : <ShieldCheck className="h-[18px] w-[18px] text-brand" />}
                <h2 className={cx("text-sm font-semibold", flags.length ? "text-ai-ink" : "text-brand-ink")}>Supervisor check · {flags.length ? flags.length + (flags.length === 1 ? " flag" : " flags") : "no issues found"}</h2>
                <span className="ml-auto text-xs text-ink-muted">Automatic rules on amount, evidence and payment</span>
              </div>
              {flags.map((flag) => (
                <div key={flag.code} className="flex items-start gap-2.5 rounded-[10px] bg-white p-3 shadow-[0_0_0_1px_#EDE4FB]">
                  <Badge tone={flag.level === "high" ? "danger" : flag.level === "medium" ? "warn" : "neutral"}>{flag.level.toUpperCase()}</Badge>
                  <p className="text-[13px] leading-relaxed"><b>{flag.title}.</b> {flag.detail}</p>
                </div>
              ))}
            </section>
          )}

          <Card title="Service record">
            {completion ? (
              <>
                <div className="grid gap-3 text-[13px] sm:grid-cols-3">
                  <div><div className="text-xs text-ink-muted">Service</div><div className="mt-0.5 font-medium text-ink">{order.serviceType}</div></div>
                  <div><div className="text-xs text-ink-muted">Technician</div><div className="mt-0.5 font-medium text-ink">{completion.technicianName}</div></div>
                  <div><div className="text-xs text-ink-muted">Completed</div><div className="num mt-0.5 font-medium text-ink">{formatTime(completion.completedAt)}{minutes !== null && minutes > 0 ? ` · ${Math.floor(minutes / 60)}h ${minutes % 60}m after slot` : ""}</div></div>
                </div>
                <div>
                  <div className="text-xs text-ink-muted">Work done</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{completion.workDone}</p>
                </div>
                <div>
                  <div className="mb-2 text-xs text-ink-muted">Evidence · {completion.files.length} {completion.files.length === 1 ? "file" : "files"}</div>
                  <EvidenceGrid completion={completion} />
                </div>
                {completion.remarks && <p className="text-[13px] text-ink-muted">Remarks · <span className="text-ink-2">{completion.remarks}</span></p>}
              </>
            ) : (
              <p className="text-[13px] text-ink-muted">The technician hasn’t submitted this job yet.</p>
            )}
          </Card>

          {canReview && (
            <Card title="Review notes">
              <label className="label"><span className="hint">Required when returning. Saved with the review.</span>
                <textarea rows={2} className="field-area" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Please add the after photo for unit C" />
              </label>
            </Card>
          )}
          {review && !canReview && (
            <Card title="Review">
              <p className="text-[13px] text-ink-2"><b className="capitalize">{review.status}</b> · {formatDateTime(review.reviewedAt)}{review.notes ? " · " + review.notes : ""}</p>
            </Card>
          )}

          <WhatsAppMessages notifications={notifications} onSent={() => reload(true)} />
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-4">
          <AmountBreakdown order={order} completion={completion} />
          <CustomerCard order={order} />
          <ActivityTimeline entries={activity} order={order} />
        </aside>
      </div>
    </div>
  );
}
