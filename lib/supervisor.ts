import type { ServiceCompletion, ServiceOrder } from "./order-types";

export type SupervisorFlag = { level: "high" | "medium" | "low"; code: string; title: string; detail: string };

/**
 * Rule-based workflow supervisor (assessment "AI Workflow Supervisor").
 * Deterministic so a manager can trust and explain every flag.
 */
export function supervisorFlags(order: ServiceOrder, completion?: ServiceCompletion | null): SupervisorFlag[] {
  if (!completion) return [];
  const flags: SupervisorFlag[] = [];
  const quote = order.quotedPrice || 0;
  const increase = quote > 0 ? (completion.finalAmount - quote) / quote : 0;

  if (increase >= 0.5) {
    flags.push({
      level: "high",
      code: "amount_over_quote",
      title: `Final amount is ${Math.round(increase * 100)}% above quote`,
      detail: `Quoted RM ${quote.toFixed(2)}, charged RM ${completion.finalAmount.toFixed(2)}.`
    });
  } else if (increase >= 0.25) {
    flags.push({
      level: "medium",
      code: "amount_over_quote",
      title: `Final amount is ${Math.round(increase * 100)}% above quote`,
      detail: `Quoted RM ${quote.toFixed(2)}, charged RM ${completion.finalAmount.toFixed(2)}.`
    });
  }

  if (completion.files.length === 0) {
    flags.push({ level: "medium", code: "no_evidence", title: "Job done but no photos uploaded", detail: "No evidence was attached to this completion." });
  }

  if (completion.extraCharges > 0 && !completion.remarks.trim() && completion.extraItems.length === 0) {
    flags.push({ level: "low", code: "extra_without_reason", title: "Extra charges without explanation", detail: "Add remarks or itemised extras." });
  }

  if (completion.paymentAmount > 0 && completion.paymentAmount < completion.finalAmount) {
    flags.push({
      level: "medium",
      code: "underpaid",
      title: "Payment received is less than final amount",
      detail: `Received RM ${completion.paymentAmount.toFixed(2)} of RM ${completion.finalAmount.toFixed(2)}.`
    });
  }

  return flags;
}
