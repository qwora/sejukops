"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, MapPin, MessageCircle, MessageSquareText, Phone } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { EmptyState, ErrorBanner, Skeleton, cx } from "@/components/ui/primitives";
import { JobStateTag } from "@/components/technician/job-bits";
import { getOrderBundle } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { useSession } from "@/lib/session";
import { formatDateTime, money, relativeSlot, timeAgo } from "@/lib/format";

export default function TechnicianJobPage() {
  return (
    <MobileShell tabs={false}>
      <JobView />
    </MobileShell>
  );
}

const CHECKLIST = ["Arrived and met customer", "Diagnosed the units", "Serviced and tested", "Before / after photos taken"];

function JobView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const { data: bundle, error, loading, reload } = useLoad(() => getOrderBundle(id), [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [checks, setChecks] = useState<boolean[]>([true, false, false, false]);

  if (loading && !bundle) {
    return <div className="space-y-3 p-4"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div>;
  }
  if (error) return <div className="p-4"><ErrorBanner message={error} onRetry={() => reload()} /></div>;
  if (!bundle) return <div className="p-4"><div className="rounded-2xl bg-white"><EmptyState title="Job not found" action={<Link href="/technician/jobs" className="font-semibold text-brand">Back to jobs</Link>} /></div></div>;

  const { order, completion, review } = bundle;
  const mine = !session.technicianName || order.assignedTechnician === session.technicianName;
  const returned = order.status === "In Progress" && review?.status === "returned";

  async function start() {
    setBusy(true);
    setActionError("");
    try {
      await apiPost(`/api/orders/${order.orderNo}/action`, { action: "start" });
      await reload(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not start the job.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- M2: New job assigned ---------- */
  if (order.status === "Assigned") {
    return (
      <div className="relative flex min-h-screen flex-col bg-brand md:min-h-[calc(100vh-48px)]">
        <div className="pointer-events-none absolute -left-4 -top-16 h-[420px] w-[420px] rounded-full border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute left-14 top-2 h-[280px] w-[280px] rounded-full border border-white/15" aria-hidden />
        <div className="relative flex items-center p-4">
          <Link href="/technician/jobs" aria-label="Back to jobs" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"><ChevronLeft className="h-5 w-5" /></Link>
        </div>
        <div className="relative px-6 pb-10 pt-6 text-center text-white">
          <p className="text-sm text-white/80">Assigned to you · {timeAgo(order.updatedAt)}</p>
          <p className="num mt-1.5 text-[34px] font-extrabold tracking-tight">{order.orderNo}</p>
        </div>
        <section className="relative mt-auto flex flex-col gap-4 rounded-t-3xl bg-white px-5 pb-6 pt-2.5 shadow-sheet">
          <span className="mx-auto h-[5px] w-10 rounded-full bg-line-strong" aria-hidden />
          <div className="flex items-center gap-3.5">
            <div className="flex-1">
              <p className="text-xs font-bold tracking-wide text-brand">NEW JOB ASSIGNED</p>
              <h1 className="mt-0.5 text-[22px] font-extrabold leading-tight tracking-tight text-ink">{order.serviceType}</h1>
            </div>
            <div className="text-right">
              <p className="num text-[22px] font-extrabold text-ink">{money(order.quotedPrice, 0)}</p>
              <p className="text-[11.5px] text-ink-muted">quoted</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-canvas px-3 py-2.5"><p className="text-[11px] text-ink-muted">When</p><p className="num mt-0.5 text-sm font-bold text-ink">{relativeSlot(order.scheduledAt)}</p></div>
            <div className="rounded-xl bg-canvas px-3 py-2.5"><p className="text-[11px] text-ink-muted">Branch</p><p className="mt-0.5 text-sm font-bold text-ink">{order.branch}</p></div>
          </div>
          <div className="flex gap-2.5 text-sm leading-snug">
            <MapPin className="h-[18px] w-[18px] flex-none text-brand" aria-hidden />
            <span><b className="text-ink">{order.customerName}</b><br /><span className="text-ink-muted">{order.address}</span></span>
          </div>
          {order.problemDescription && <p className="rounded-xl bg-canvas px-3 py-2.5 text-[13px] leading-relaxed text-ink-2">{order.problemDescription}</p>}
          {order.adminNotes && (
            <div className="flex gap-2.5 rounded-xl bg-[#FFF8EB] px-3 py-2.5 text-[13px] text-[#5C3800]"><MessageSquareText className="mt-0.5 h-4 w-4 flex-none" aria-hidden />{order.adminNotes}</div>
          )}
          {actionError && <ErrorBanner message={actionError} />}
          {!mine && <p className="text-center text-[13px] text-danger">This job is assigned to {order.assignedTechnician}.</p>}
          <div className="flex gap-2.5">
            <a href={"tel:+" + order.customerPhone} className="flex h-[54px] items-center gap-2 rounded-[14px] bg-rail px-5 text-[15px] font-bold text-ink-2"><Phone className="h-[18px] w-[18px]" />Call</a>
            <button onClick={start} disabled={busy || !mine} className="flex h-[54px] flex-1 items-center justify-center rounded-[14px] bg-brand text-base font-extrabold text-white shadow-cta transition active:scale-[.99] disabled:opacity-60">
              {busy ? "Starting…" : "Accept & start job"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* ---------- Done / reviewed / closed: read-only record ---------- */
  if (order.status !== "In Progress") {
    return (
      <div>
        <TopBar title={order.orderNo} />
        <div className="space-y-3 p-4">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-2"><JobStateTag status={order.status} /><span className="text-xs text-ink-muted">{completion ? "Completed " + formatDateTime(completion.completedAt) : ""}</span></div>
            <h1 className="mt-2 text-lg font-bold text-ink">{order.serviceType}</h1>
            <p className="text-[13px] text-ink-muted">{order.customerName} · {order.address}</p>
          </div>
          {completion && (
            <div className="space-y-2 rounded-2xl bg-white p-4 text-[13px]">
              <p className="text-xs font-bold tracking-wide text-ink-muted">WORK DONE</p>
              <p className="leading-relaxed text-ink-2">{completion.workDone}</p>
              <div className="flex justify-between border-t border-line pt-2.5"><span className="text-ink-muted">Final amount</span><span className="num font-bold text-ink">{money(completion.finalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Evidence</span><span>{completion.files.length} files</span></div>
            </div>
          )}
          {order.status === "Job Done" && <Link href={`/technician/jobs/${order.orderNo}/success`} className="flex h-12 items-center justify-center rounded-xl bg-[#25D366] text-[15px] font-bold text-[#08361C]"><MessageCircle className="mr-2 h-[18px] w-[18px]" />Customer WhatsApp message</Link>}
          <p className="px-2 text-center text-xs text-ink-faint">{order.status === "Job Done" ? "Waiting for manager review." : "This job is " + order.status.toLowerCase() + "."}</p>
        </div>
      </div>
    );
  }

  /* ---------- M3: In progress ---------- */
  const doneCount = checks.filter(Boolean).length;
  return (
    <div className="relative min-h-screen pb-28 md:min-h-[calc(100vh-48px)]">
      <div className="h-24 bg-brand">
        <div className="flex items-center justify-between p-4">
          <Link href="/technician/jobs" aria-label="Back to jobs" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <span className="flex h-10 items-center gap-2 rounded-full bg-black/25 px-3.5 text-[13px] font-bold text-white"><span className="h-2 w-2 rounded-full bg-[#F2B544]" />In progress</span>
        </div>
      </div>
      <div className="-mt-6 rounded-t-3xl bg-white px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="num text-xs font-semibold text-ink-muted">{order.orderNo} · {order.serviceType}</p>
            <h1 className="mt-1 text-[21px] font-extrabold tracking-tight text-ink">{order.customerName}</h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">{order.address}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-ink-muted">Quoted</p>
            <p className="num text-lg font-extrabold text-brand">{money(order.quotedPrice, 0)}</p>
          </div>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <a href={"tel:+" + order.customerPhone} className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-canvas text-[13px] font-bold text-ink"><Phone className="h-4 w-4" />Call</a>
          <a href={"https://wa.me/" + order.customerPhone} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-brand-tint text-[13px] font-bold text-brand-ink"><MessageCircle className="h-4 w-4" />WhatsApp</a>
        </div>
      </div>

      <div className="space-y-3 px-4 pt-3">
        {returned && (
          <div className="rounded-xl bg-danger-tint px-4 py-3 text-[13px] text-danger">
            <p className="font-bold">Returned by manager</p>
            <p className="mt-0.5">{review?.notes || "Please update the service record and submit again."}</p>
          </div>
        )}
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-[11px] font-bold tracking-wide text-ink-muted">PROBLEM</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{order.problemDescription || "No description provided."}</p>
          {order.adminNotes && <p className="mt-2 rounded-lg bg-[#FFF8EB] px-3 py-2 text-[13px] text-[#5C3800]">{order.adminNotes}</p>}
        </div>
        <div className="rounded-2xl bg-white px-4 pb-1 pt-3">
          <div className="flex items-baseline justify-between"><h2 className="text-[15px] font-bold text-ink">Checklist</h2><span className="num text-xs font-semibold text-ink-muted">{doneCount}/{CHECKLIST.length}</span></div>
          <ul>
            {CHECKLIST.map((label, i) => (
              <li key={label}>
                <button onClick={() => setChecks((current) => current.map((v, j) => (j === i ? !v : v)))} aria-pressed={checks[i]} className="flex min-h-[50px] w-full items-center gap-3 border-b border-line text-left last:border-0">
                  <span className={cx("flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg transition", checks[i] ? "bg-brand" : "shadow-[inset_0_0_0_2px_#C5D2DA]")}>
                    {checks[i] && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                  </span>
                  <span className={cx("flex-1 text-sm font-semibold", checks[i] ? "text-ink-faint line-through" : "text-ink")}>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="px-2 text-center text-[11.5px] text-ink-faint">Checklist is a personal guide and isn’t saved.</p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[440px] border-t border-line bg-white px-5 pb-6 pt-3 md:absolute md:rounded-b-[28px]">
        <button onClick={() => router.push(`/technician/jobs/${order.orderNo}/complete`)} disabled={!mine} className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand text-base font-extrabold text-white shadow-cta active:scale-[.99] disabled:opacity-50">
          Complete job <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

function TopBar({ title, back = "/technician/jobs" }: { title: string; back?: string }) {
  return (
    <div className="flex h-[60px] items-center gap-2 border-b border-line bg-white px-2">
      <Link href={back} aria-label="Back" className="flex h-11 w-11 items-center justify-center text-ink"><ChevronLeft className="h-5 w-5" /></Link>
      <span className="num text-[17px] font-extrabold text-ink">{title}</span>
    </div>
  );
}
