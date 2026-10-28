import { technicianOptions } from "@/lib/order-types";

export type Period = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_7_days";

export const PERIODS: Period[] = ["today", "yesterday", "this_week", "last_week", "this_month", "last_7_days"];

export type Intent =
  | { type: "jobs_by_technician"; technician: string; period: Period }
  | { type: "top_technician"; period: Period; metric: "jobs" | "revenue" }
  | { type: "jobs_completed_count"; period: Period }
  | { type: "revenue_summary"; period: Period }
  | { type: "awaiting_review" }
  | { type: "unassigned_orders" }
  | { type: "overloaded_technicians"; period: Period }
  | { type: "flagged_jobs"; period: Period }
  | { type: "extra_charges_above"; amount: number; period: Period }
  | { type: "unsupported"; reason?: string };

/** Description shown to the model. The model may only choose from these. */
export const INTENT_GUIDE = `Choose exactly one intent for the manager's question and return JSON only.
Intents:
- jobs_by_technician {technician, period}: which jobs a technician completed.
- top_technician {period, metric: "jobs"|"revenue"}: best technician by completed jobs or amount.
- jobs_completed_count {period}: how many jobs were completed.
- revenue_summary {period}: total final amount collected.
- awaiting_review {}: jobs marked Job Done waiting for manager review.
- unassigned_orders {}: new orders without a technician.
- overloaded_technicians {period}: technicians with much higher workload than average.
- flagged_jobs {period}: completed jobs with issues (amount far above quote, no photos).
- extra_charges_above {amount, period}: completed jobs whose extra charges exceed an amount in RM.
- unsupported {reason}: anything else (general knowledge, weather, editing data, personal data).
Technicians: ${technicianOptions.join(", ")}.
Periods: today, yesterday, this_week, last_week, this_month, last_7_days. Default period is this_week.
Return like {"type":"jobs_by_technician","technician":"Ali","period":"last_week"}.`;

function pickPeriod(lower: string, fallback: Period = "this_week"): Period {
  if (/\byesterday\b|\bsemalam\b/.test(lower)) return "yesterday";
  if (/\btoday\b|\bhari ini\b/.test(lower)) return "today";
  if (/last week|previous week|minggu lepas/.test(lower)) return "last_week";
  if (/this month|month|bulan/.test(lower)) return "this_month";
  if (/last 7 days|past week|7 days/.test(lower)) return "last_7_days";
  if (/this week|week|minggu ini/.test(lower)) return "this_week";
  return fallback;
}

/** Deterministic fallback classifier, used when AI is unavailable. */
export function classifyWithRules(question: string): Intent {
  const lower = question.toLowerCase();
  const tech = technicianOptions.find((name) => new RegExp("\\b" + name.toLowerCase() + "\\b").test(lower));
  const amount = Number((lower.match(/rm\s?(\d+(?:\.\d+)?)/) ?? lower.match(/(?:above|over|more than|>)\s?(\d+(?:\.\d+)?)/))?.[1]);

  if (/overload|too many|busy|workload|burn|terlalu banyak|sibuk/.test(lower)) return { type: "overloaded_technicians", period: pickPeriod(lower) };
  if (/flag|issue|problem|suspicious|no photo|without photo|above quote|over quote/.test(lower)) return { type: "flagged_jobs", period: pickPeriod(lower) };
  if (/extra charge/.test(lower) && Number.isFinite(amount)) return { type: "extra_charges_above", amount, period: pickPeriod(lower) };
  if (/waiting|awaiting|needs? review|pending review|to review|menunggu/.test(lower)) return { type: "awaiting_review" };
  if (/unassigned|not assigned|without (a )?technician/.test(lower)) return { type: "unassigned_orders" };
  if (/(most|top|highest|best)/.test(lower) && /(revenue|amount|money|sales|rm)/.test(lower)) return { type: "top_technician", period: pickPeriod(lower), metric: "revenue" };
  if (/(most|top|highest|best|paling banyak|terbanyak)/.test(lower)) return { type: "top_technician", period: pickPeriod(lower), metric: "jobs" };
  if (/(revenue|collected|total amount|how much|jumlah kutipan|hasil)/.test(lower)) return { type: "revenue_summary", period: pickPeriod(lower) };
  if (tech && /(job|complete|finish|done|work|kerja|siap)/.test(lower)) return { type: "jobs_by_technician", technician: tech, period: pickPeriod(lower) };
  if (/(how many|number of|count|berapa|bilangan)/.test(lower) && /(job|complete|done|kerja|siap)/.test(lower)) return { type: "jobs_completed_count", period: pickPeriod(lower, "today") };
  return { type: "unsupported" };
}

/** Validate the model's JSON. Anything unexpected becomes unsupported. */
export function sanitizeIntent(raw: unknown): Intent | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const period = PERIODS.includes(value.period as Period) ? (value.period as Period) : "this_week";
  switch (value.type) {
    case "jobs_by_technician": {
      const tech = technicianOptions.find((name) => name.toLowerCase() === String(value.technician ?? "").toLowerCase());
      return tech ? { type: "jobs_by_technician", technician: tech, period } : { type: "unsupported", reason: "Unknown technician" };
    }
    case "top_technician":
      return { type: "top_technician", period, metric: value.metric === "revenue" ? "revenue" : "jobs" };
    case "jobs_completed_count":
      return { type: "jobs_completed_count", period };
    case "revenue_summary":
      return { type: "revenue_summary", period };
    case "awaiting_review":
      return { type: "awaiting_review" };
    case "unassigned_orders":
      return { type: "unassigned_orders" };
    case "overloaded_technicians":
      return { type: "overloaded_technicians", period };
    case "flagged_jobs":
      return { type: "flagged_jobs", period };
    case "extra_charges_above": {
      const amount = Number(value.amount);
      return Number.isFinite(amount) && amount >= 0 ? { type: "extra_charges_above", amount, period } : null;
    }
    case "unsupported":
      return { type: "unsupported", reason: typeof value.reason === "string" ? value.reason.slice(0, 120) : undefined };
    default:
      return null;
  }
}
