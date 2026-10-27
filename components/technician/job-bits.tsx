"use client";

import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import type { ServiceOrder } from "@/lib/order-types";
import { formatTime, relativeSlot } from "@/lib/format";
import { cx } from "@/components/ui/primitives";

export const JOB_STATE: Record<string, { label: string; className: string; dot: string }> = {
  Assigned: { label: "ASSIGNED", className: "bg-st-asg-bg text-st-asg-fg", dot: "#2E7BAA" },
  "In Progress": { label: "IN PROGRESS", className: "bg-st-prog-bg text-st-prog-fg", dot: "#C2620A" },
  "Job Done": { label: "DONE", className: "bg-st-done-bg text-st-done-fg", dot: "#0B6E4F" },
  Reviewed: { label: "REVIEWED", className: "bg-st-rev-bg text-st-rev-fg", dot: "#5E35B1" },
  Closed: { label: "CLOSED", className: "bg-st-cls-bg text-st-cls-fg", dot: "#8AA2B0" },
  New: { label: "NEW", className: "bg-st-new-bg text-st-new-fg", dot: "#8AA2B0" }
};

export function JobStateTag({ status }: { status: ServiceOrder["status"] }) {
  const state = JOB_STATE[status];
  return <span className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide", state.className)}>{state.label}</span>;
}

export function NextJobCard({ job, returned }: { job: ServiceOrder; returned?: boolean }) {
  const inProgress = job.status === "In Progress";
  return (
    <div className="rounded-[28px] border border-line bg-white p-[18px]">
      <Link href={"/technician/jobs/" + job.orderNo} className="block">
        <div className="flex items-center gap-2">
          <JobStateTag status={job.status} />
          {returned && <span className="rounded-md bg-danger-tint px-2 py-0.5 text-[11px] font-bold text-danger">RETURNED</span>}
          <span className="num text-xs font-semibold text-ink-muted">{job.orderNo}</span>
          <span className="num ml-auto text-lg font-light text-ink">{job.scheduledAt ? formatTime(job.scheduledAt) : "—"}</span>
        </div>
        <div className="mt-2.5 text-xl font-light leading-snug tracking-tight text-ink">{job.serviceType}</div>
        <div className="mt-2 flex gap-2 text-[13px] leading-snug text-ink-2">
          <MapPin className="mt-0.5 h-4 w-4 flex-none text-brand" aria-hidden />
          <span><span className="font-semibold">{job.customerName}</span> · {job.address}</span>
        </div>
      </Link>
      <div className="mt-3.5 flex gap-2">
        <Link href={"/technician/jobs/" + job.orderNo} className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-brand text-[15px] font-medium text-white shadow-cta active:scale-[.99]">
          {inProgress ? "Continue job" : "Open job"}
        </Link>
        <a href={"tel:+" + job.customerPhone} aria-label={"Call " + job.customerName} className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-rail text-ink">
          <Phone className="h-[18px] w-[18px]" />
        </a>
      </div>
    </div>
  );
}

export function JobRow({ job }: { job: ServiceOrder }) {
  const done = ["Job Done", "Reviewed", "Closed"].includes(job.status);
  return (
    <Link href={"/technician/jobs/" + job.orderNo} className="flex min-h-[56px] items-center gap-3 border-b border-line py-3 last:border-0">
      <span className={cx("num w-[44px] text-[13px] font-bold", done ? "text-ink-faint" : "text-ink")}>{job.scheduledAt ? formatTime(job.scheduledAt) : "—"}</span>
      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: JOB_STATE[job.status].dot }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate text-sm font-semibold", done ? "text-ink-faint" : "text-ink")}>{job.serviceType}</span>
        <span className="block truncate text-xs text-ink-faint">{job.customerName} · {relativeSlot(job.scheduledAt).startsWith("Today") ? job.branch : relativeSlot(job.scheduledAt)}</span>
      </span>
      <span className="text-[11px] font-bold" style={{ color: JOB_STATE[job.status].dot }}>{done ? "Done" : job.status === "In Progress" ? "Now" : "Next"}</span>
    </Link>
  );
}
