import { serverClient } from "../db";
import type { Intent, Period } from "./intents";
import { formatDate, formatTime, money, startOfMyDay, startOfMyMonth, startOfMyWeek } from "@/lib/format";

type Db = ReturnType<typeof serverClient>;
type Row = Record<string, string | number>;

export type QueryResult = {
  answer: string;
  columns: string[];
  rows: Row[];
  params: Record<string, string | number>;
  range?: { from: string; to: string; label: string };
};

export function periodRange(period: Period, now = new Date()) {
  const day = 86400000;
  const today = startOfMyDay(now);
  switch (period) {
    case "today":
      return { from: today, to: new Date(today.getTime() + day), label: "today" };
    case "yesterday":
      return { from: new Date(today.getTime() - day), to: today, label: "yesterday" };
    case "last_week": {
      const from = startOfMyWeek(now, -1);
      return { from, to: startOfMyWeek(now), label: "last week (" + formatDate(from.toISOString()) + " – " + formatDate(new Date(startOfMyWeek(now).getTime() - day).toISOString()) + ")" };
    }
    case "this_month":
      return { from: startOfMyMonth(now), to: new Date(today.getTime() + day), label: "this month" };
    case "last_7_days":
      return { from: new Date(today.getTime() - 6 * day), to: new Date(today.getTime() + day), label: "the last 7 days" };
    case "this_week":
    default:
      return { from: startOfMyWeek(now), to: new Date(today.getTime() + day), label: "this week" };
  }
}

type CompletionRow = {
  completed_at: string;
  final_amount: number;
  extra_charges: number;
  remarks: string | null;
  technicians: { name: string } | null;
  orders: { order_no: string; service_type: string; customer_name: string; quoted_price: number } | null;
  service_files: Array<{ count: number }>;
};

/** Controlled retrieval: only the columns and date range the intent needs. */
async function completionsIn(db: Db, period: Period, technician?: string) {
  const range = periodRange(period);
  let query = db
    .from("service_completions")
    .select("completed_at, final_amount, extra_charges, remarks, technicians!inner(name), orders(order_no, service_type, customer_name, quoted_price), service_files(count)")
    .gte("completed_at", range.from.toISOString())
    .lt("completed_at", range.to.toISOString())
    .order("completed_at", { ascending: true })
    .limit(500);
  if (technician) query = query.eq("technicians.name", technician);
  const { data, error } = await query;
  if (error) throw error;
  return { range, rows: (data ?? []) as unknown as CompletionRow[] };
}

function byTechnician(rows: CompletionRow[]) {
  const map = new Map<string, { jobs: number; amount: number }>();
  for (const row of rows) {
    const name = row.technicians?.name ?? "Unknown";
    const current = map.get(name) ?? { jobs: 0, amount: 0 };
    current.jobs += 1;
    current.amount += Number(row.final_amount);
    map.set(name, current);
  }
  return [...map.entries()].map(([name, value]) => ({ name, ...value }));
}

function plural(count: number, word: string) {
  return count + " " + word + (count === 1 ? "" : "s");
}

export async function runIntent(db: Db, intent: Intent): Promise<QueryResult> {
  switch (intent.type) {
    case "jobs_by_technician": {
      const { range, rows } = await completionsIn(db, intent.period, intent.technician);
      const list = rows.map((row) => ({
        Order: row.orders?.order_no ?? "",
        Service: row.orders?.service_type ?? "",
        Customer: row.orders?.customer_name ?? "",
        Completed: formatDate(row.completed_at, { weekday: "short", day: "numeric", month: "short" }) + " " + formatTime(row.completed_at),
        Amount: money(row.final_amount)
      }));
      const total = rows.reduce((sum, row) => sum + Number(row.final_amount), 0);
      return {
        answer: rows.length
          ? `Technician ${intent.technician} completed ${plural(rows.length, "job")} ${range.label}, totalling ${money(total)}:\n` + list.map((item) => `${item.Order} – ${item.Service}`).join("\n")
          : `Technician ${intent.technician} has no completed jobs ${range.label}.`,
        columns: ["Order", "Service", "Customer", "Completed", "Amount"],
        rows: list,
        params: { technician: intent.technician, period: intent.period },
        range: { from: range.from.toISOString(), to: range.to.toISOString(), label: range.label }
      };
    }

    case "top_technician": {
      const { range, rows } = await completionsIn(db, intent.period);
      const ranked = byTechnician(rows).sort((a, b) => (intent.metric === "revenue" ? b.amount - a.amount : b.jobs - a.jobs || b.amount - a.amount));
      const list = ranked.map((item, index) => ({ Rank: index + 1, Technician: item.name, Jobs: item.jobs, Amount: money(item.amount) }));
      const top = ranked[0];
      return {
        answer: top
          ? intent.metric === "revenue"
            ? `${top.name} brought in the most ${range.label} with ${money(top.amount)} from ${plural(top.jobs, "job")}.`
            : ranked[1] && ranked[1].jobs === top.jobs
              ? `${top.name} and ${ranked[1].name} are tied for the most jobs ${range.label} with ${plural(top.jobs, "job")} each.`
              : `${top.name} completed the most jobs ${range.label} with ${plural(top.jobs, "job")}` + (ranked[1] ? `, followed by ${ranked[1].name} (${ranked[1].jobs}).` : ".")
          : `No completed jobs are recorded ${range.label}.`,
        columns: ["Rank", "Technician", "Jobs", "Amount"],
        rows: list,
        params: { period: intent.period, metric: intent.metric },
        range: { from: range.from.toISOString(), to: range.to.toISOString(), label: range.label }
      };
    }

    case "jobs_completed_count":
    case "revenue_summary": {
      const { range, rows } = await completionsIn(db, intent.period);
      const total = rows.reduce((sum, row) => sum + Number(row.final_amount), 0);
      const list = byTechnician(rows).sort((a, b) => b.jobs - a.jobs).map((item) => ({ Technician: item.name, Jobs: item.jobs, Amount: money(item.amount) }));
      return {
        answer:
          intent.type === "jobs_completed_count"
            ? `${plural(rows.length, "job")} ${rows.length === 1 ? "was" : "were"} completed ${range.label}` + (rows.length ? `, worth ${money(total)} in total.` : ".")
            : `${money(total)} was collected ${range.label} from ${plural(rows.length, "completed job")}.`,
        columns: ["Technician", "Jobs", "Amount"],
        rows: list,
        params: { period: intent.period },
        range: { from: range.from.toISOString(), to: range.to.toISOString(), label: range.label }
      };
    }

    case "awaiting_review": {
      const { data, error } = await db
        .from("orders")
        .select("order_no, service_type, customer_name, technicians(name), service_completions(final_amount, completed_at)")
        .eq("status", "job_done")
        .order("updated_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      const list = (data ?? []).map((row: Record<string, unknown>) => {
        const completion = (Array.isArray(row.service_completions) ? row.service_completions[0] : row.service_completions) as { final_amount: number; completed_at: string } | null;
        return {
          Order: String(row.order_no),
          Service: String(row.service_type),
          Technician: (row.technicians as { name: string } | null)?.name ?? "—",
          Amount: completion ? money(completion.final_amount) : "—",
          Done: completion ? formatDate(completion.completed_at) + " " + formatTime(completion.completed_at) : "—"
        };
      });
      return {
        answer: list.length ? `${plural(list.length, "job")} ${list.length === 1 ? "is" : "are"} waiting for manager review:\n` + list.map((item) => `${item.Order} – ${item.Service} (${item.Technician})`).join("\n") : "No jobs are waiting for manager review.",
        columns: ["Order", "Service", "Technician", "Amount", "Done"],
        rows: list,
        params: {}
      };
    }

    case "unassigned_orders": {
      const { data, error } = await db.from("orders").select("order_no, service_type, customer_name, branch, scheduled_at, created_at").eq("status", "new").order("created_at").limit(50);
      if (error) throw error;
      const list = (data ?? []).map((row) => ({ Order: row.order_no, Service: row.service_type, Customer: row.customer_name, Branch: row.branch, Scheduled: row.scheduled_at ? formatDate(row.scheduled_at) + " " + formatTime(row.scheduled_at) : "—" }));
      return {
        answer: list.length ? `${plural(list.length, "order")} ${list.length === 1 ? "has" : "have"} no technician yet:\n` + list.map((item) => `${item.Order} – ${item.Service}, ${item.Branch}`).join("\n") : "Every order has a technician assigned.",
        columns: ["Order", "Service", "Customer", "Branch", "Scheduled"],
        rows: list,
        params: {}
      };
    }

    case "overloaded_technicians": {
      const { range, rows } = await completionsIn(db, intent.period);
      const { data: techs } = await db.from("technicians").select("name").eq("active", true);
      const counts = byTechnician(rows);
      const names = (techs ?? []).map((item) => item.name as string);
      const all = names.map((name) => counts.find((item) => item.name === name) ?? { name, jobs: 0, amount: 0 });
      const average = all.length ? all.reduce((sum, item) => sum + item.jobs, 0) / all.length : 0;
      const list = all
        .sort((a, b) => b.jobs - a.jobs)
        .map((item) => ({ Technician: item.name, Jobs: item.jobs, "vs average": average ? (item.jobs / average).toFixed(1) + "×" : "—", Status: average && item.jobs >= average * 1.5 ? "Overloaded" : "Normal" }));
      const overloaded = list.filter((item) => item.Status === "Overloaded");
      return {
        answer: overloaded.length
          ? overloaded.map((item) => `Technician ${item.Technician} completed ${plural(Number(item.Jobs), "job")} ${range.label}, ${item["vs average"]} the team average of ${average.toFixed(1)}.`).join("\n") + "\nConsider moving new jobs to technicians with lighter loads."
          : `No technician is overloaded ${range.label}. Team average is ${average.toFixed(1)} jobs.`,
        columns: ["Technician", "Jobs", "vs average", "Status"],
        rows: list,
        params: { period: intent.period, threshold: "1.5× average" },
        range: { from: range.from.toISOString(), to: range.to.toISOString(), label: range.label }
      };
    }

    case "flagged_jobs":
    case "extra_charges_above": {
      const { range, rows } = await completionsIn(db, intent.period);
      const matches = rows
        .map((row) => {
          const quote = Number(row.orders?.quoted_price ?? 0);
          const increase = quote ? (Number(row.final_amount) - quote) / quote : 0;
          const files = row.service_files?.[0]?.count ?? 0;
          const reasons: string[] = [];
          if (intent.type === "extra_charges_above") {
            if (Number(row.extra_charges) > intent.amount) reasons.push("Extra " + money(row.extra_charges));
          } else {
            if (increase >= 0.25) reasons.push(Math.round(increase * 100) + "% above quote");
            if (files === 0) reasons.push("No photos");
          }
          return { row, reasons };
        })
        .filter((item) => item.reasons.length);
      const list = matches.map(({ row, reasons }) => ({
        Order: row.orders?.order_no ?? "",
        Technician: row.technicians?.name ?? "",
        Quote: money(row.orders?.quoted_price ?? 0),
        Final: money(row.final_amount),
        Issue: reasons.join(", ")
      }));
      const what = intent.type === "extra_charges_above" ? `with extra charges above ${money(intent.amount)}` : "flagged for review";
      return {
        answer: list.length ? `${plural(list.length, "completed job")} ${what} ${range.label}:\n` + list.map((item) => `${item.Order} (${item.Technician}) – ${item.Issue}`).join("\n") : `No completed jobs ${what} ${range.label}.`,
        columns: ["Order", "Technician", "Quote", "Final", "Issue"],
        rows: list,
        params: intent.type === "extra_charges_above" ? { amount: intent.amount, period: intent.period } : { period: intent.period, rules: "≥25% over quote, no photos" },
        range: { from: range.from.toISOString(), to: range.to.toISOString(), label: range.label }
      };
    }

    default:
      return { answer: "", columns: [], rows: [], params: {} };
  }
}
