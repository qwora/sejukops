"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarClock, ClipboardCheck, UserRoundPlus } from "lucide-react";
import { DesktopShell, PageHeader } from "@/components/shell/desktop-shell";
import { Avatar, Button, Card, EmptyState, ErrorBanner, LinkButton, Notice, PageLoading, StatusPill, StatusStepper } from "@/components/ui/primitives";
import { ActivityTimeline, AmountBreakdown, CustomerCard, WhatsAppMessages } from "@/components/orders/order-parts";
import { getOrderBundle, listTechnicians } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { useSession } from "@/lib/session";
import { formatDateTime, relativeSlot } from "@/lib/format";

export default function OrderDetailPage() {
  return (
    <DesktopShell roles={["admin", "manager"]}>
      <OrderDetail />
    </DesktopShell>
  );
}

function toLocalInput(iso: string | null) {
  const date = iso ? new Date(iso) : new Date(Date.now() + 86400000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const session = useSession();
  const { data, error, loading, reload } = useLoad(async () => {
    const [bundle, techs] = await Promise.all([getOrderBundle(id), listTechnicians()]);
    return { bundle, techs };
  }, [id]);
  const [created, setCreated] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [tech, setTech] = useState("");
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);

  useEffect(() => setCreated(new URLSearchParams(window.location.search).has("created")), []);
  useEffect(() => {
    if (data?.bundle) {
      setTech(data.bundle.order.assignedTechnician);
      setSlot(toLocalInput(data.bundle.order.scheduledAt));
    }
  }, [data]);

  if (loading && !data) return <div className="mx-auto max-w-[1080px]"><PageLoading rows={6} /></div>;
  if (error) return <div className="mx-auto max-w-[1080px]"><ErrorBanner message={"Could not load this order: " + error} onRetry={() => reload()} /></div>;
  if (!data?.bundle) return <div className="card mx-auto max-w-[1080px]"><EmptyState title="Order not found" body={`There is no order ${id}.`} action={<LinkButton href="/admin/orders">Back to orders</LinkButton>} /></div>;

  const { order, completion, activity, notifications, review } = data.bundle;
  const lastDecline = order.status === "New" && activity[0]?.action === "decline" ? activity[0] : null;
  const isAdmin = session.role === "admin";
  const canAssign = isAdmin && (order.status === "New" || order.status === "Assigned");
  const canClose = order.status === "Reviewed";

  async function act(action: string, body: Record<string, unknown>, message: string) {
    setBusy(action);
    setActionError("");
    setNotice("");
    try {
      await apiPost(`/api/orders/${order.orderNo}/action`, { action, ...body });
      setNotice(message);
      setShowReschedule(false);
      setReason("");
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
        back="/admin/orders"
        title={<span className="num">{order.orderNo}</span>}
        meta={<StatusPill status={order.status} />}
        subtitle={"Created " + formatDateTime(order.createdAt)}
        actions={
          <>
            {order.status === "Job Done" && <LinkButton variant="primary" href={"/manager/reviews/" + order.orderNo} icon={<ClipboardCheck className="h-4 w-4" />}>Open review</LinkButton>}
            {canClose && <Button variant="primary" loading={busy === "close"} onClick={() => act("close", {}, order.orderNo + " closed.")}>Close order</Button>}
          </>
        }
      />

      {created && !notice && <Notice>Order {order.orderNo} created{order.assignedTechnician ? " and assigned to " + order.assignedTechnician : ""}. {order.assignedTechnician ? "Send the job to the technician on WhatsApp below." : "Assign a technician when ready."}</Notice>}
      {notice && <Notice>{notice}</Notice>}
      {lastDecline && !notice && <Notice tone="warn">{lastDecline.actor} couldn’t take this job: “{lastDecline.note}”. Assign another technician.</Notice>}
      {actionError && <ErrorBanner message={actionError} />}

      <StatusStepper status={order.status} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          <Card title="Service request">
            <div className="grid gap-3 text-[13px] sm:grid-cols-3">
              <div><div className="text-xs text-ink-muted">Service</div><div className="mt-0.5 font-medium text-ink">{order.serviceType}</div></div>
              <div><div className="text-xs text-ink-muted">Branch</div><div className="mt-0.5 font-medium text-ink">{order.branch}</div></div>
              <div>
                <div className="text-xs text-ink-muted">Scheduled</div>
                <div className="num mt-0.5 font-medium text-ink">{relativeSlot(order.scheduledAt)}{order.rescheduleCount > 0 && <span className="ml-1.5 text-xs font-semibold text-warn">rescheduled {order.rescheduleCount}×</span>}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">Problem description</div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{order.problemDescription || "No description provided."}</p>
            </div>
            {order.adminNotes && (
              <div className="rounded-[10px] bg-warn-tint px-3 py-2 text-[13px] text-[#5C3800]"><span className="font-semibold">Admin notes · </span>{order.adminNotes}</div>
            )}
          </Card>

          {completion && (
            <Card title="Service record" action={<span className="hint">Completed {formatDateTime(completion.completedAt)} by {completion.technicianName}</span>}>
              <p className="text-[13px] leading-relaxed text-ink-2">{completion.workDone}</p>
              {completion.remarks && <p className="text-[13px] text-ink-muted">Remarks · {completion.remarks}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                <span>{completion.files.length} evidence {completion.files.length === 1 ? "file" : "files"}</span>
                {review && <span>· Review: <b className="text-ink-2">{review.status}</b>{review.notes ? " – " + review.notes : ""}</span>}
                <Link href={"/manager/reviews/" + order.orderNo} className="font-semibold text-ink underline-offset-2 hover:underline">View full record →</Link>
              </div>
            </Card>
          )}

          <WhatsAppMessages notifications={notifications} onSent={() => reload(true)} />
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-4">
          <Card title="Technician">
            <div className="flex items-center gap-3">
              <Avatar name={order.assignedTechnician} size={36} />
              <div className="text-[13px]">
                <div className="font-semibold text-ink">{order.assignedTechnician || "Not assigned"}</div>
                <div className="text-ink-muted">{order.assignedTechnician ? data.techs.find((t) => t.name === order.assignedTechnician)?.branch : "Choose who goes to this job"}</div>
              </div>
            </div>
            {canAssign && (
              <div className="flex gap-2">
                <select aria-label="Technician" value={tech} onChange={(e) => setTech(e.target.value)} className="field-input">
                  <option value="">Choose technician</option>
                  {data.techs.map((t) => <option key={t.id} value={t.name}>{t.name} · {t.branch}</option>)}
                </select>
                <Button variant="primary" icon={<UserRoundPlus className="h-4 w-4" />} disabled={!tech || (tech === order.assignedTechnician && order.status === "Assigned")} loading={busy === "assign"} onClick={() => act("assign", { technician: tech }, `${order.orderNo} assigned to ${tech}. WhatsApp message ready.`)}>
                  {order.assignedTechnician ? "Reassign" : "Assign"}
                </Button>
              </div>
            )}
            {canAssign && (
              <div className="border-t border-line pt-3">
                {!showReschedule ? (
                  <Button size="sm" variant="ghost" icon={<CalendarClock className="h-4 w-4" />} onClick={() => setShowReschedule(true)}>Reschedule</Button>
                ) : (
                  <div className="space-y-2 animate-fade-up">
                    <label className="label">New slot<input type="datetime-local" className="field-input num" value={slot} onChange={(e) => setSlot(e.target.value)} /></label>
                    <label className="label">Reason<input className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer not home" /></label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" loading={busy === "reschedule"} onClick={() => act("reschedule", { scheduledAt: new Date(slot).toISOString(), notes: reason }, "Job rescheduled.")}>Save</Button>
                      <Button size="sm" onClick={() => setShowReschedule(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          <AmountBreakdown order={order} completion={completion} />
          <CustomerCard order={order} />
          <ActivityTimeline entries={activity} order={order} />
        </aside>
      </div>
    </div>
  );
}
