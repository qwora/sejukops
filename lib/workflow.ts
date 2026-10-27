import type { OrderStatus } from "./order-types";

export type AppRole = "admin" | "technician" | "manager";

export const statusToDb: Record<OrderStatus, string> = {
  New: "new",
  Assigned: "assigned",
  "In Progress": "in_progress",
  "Job Done": "job_done",
  Reviewed: "reviewed",
  Closed: "closed"
};

export const statusFromDb: Record<string, OrderStatus> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  job_done: "Job Done",
  reviewed: "Reviewed",
  closed: "Closed"
};

export type WorkflowAction = "assign" | "start" | "complete" | "approve" | "return" | "close" | "reschedule";

type Rule = { roles: AppRole[]; from: OrderStatus[]; to?: OrderStatus; label: string };

/**
 * The single source of truth for status changes.
 * New → Assigned → In Progress → Job Done → Reviewed → Closed
 */
export const WORKFLOW: Record<WorkflowAction, Rule> = {
  assign: { roles: ["admin"], from: ["New", "Assigned"], to: "Assigned", label: "Technician assigned" },
  reschedule: { roles: ["admin"], from: ["New", "Assigned"], label: "Job rescheduled" },
  start: { roles: ["technician"], from: ["Assigned"], to: "In Progress", label: "Job started" },
  complete: { roles: ["technician"], from: ["In Progress"], to: "Job Done", label: "Job marked done" },
  approve: { roles: ["manager"], from: ["Job Done"], to: "Reviewed", label: "Reviewed by manager" },
  return: { roles: ["manager"], from: ["Job Done"], to: "In Progress", label: "Returned to technician" },
  close: { roles: ["manager", "admin"], from: ["Reviewed"], to: "Closed", label: "Order closed" }
};

export function checkTransition(action: WorkflowAction, role: AppRole, current: OrderStatus) {
  const rule = WORKFLOW[action];
  if (!rule.roles.includes(role)) {
    return { ok: false as const, error: `Only ${rule.roles.join(" or ")} can ${action} a job.` };
  }
  if (!rule.from.includes(current)) {
    return { ok: false as const, error: `Cannot ${action} a job that is ${current}.` };
  }
  return { ok: true as const, next: rule.to ?? current };
}

export const MAX_EVIDENCE_FILES = 6;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function calculateFinalAmount(quotedPrice: number, extraCharges: number) {
  return Math.round((Number(quotedPrice) + Math.max(0, Number(extraCharges) || 0)) * 100) / 100;
}
