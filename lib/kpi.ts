import type { ServiceCompletion, ServiceOrder } from "./order-types";
import { dayKey, formatDate, startOfMyDay, startOfMyMonth, startOfMyWeek } from "./format";

export type KpiPeriod = "today" | "week" | "month";

const DAY = 86400000;

export function periodBounds(period: KpiPeriod, now = new Date()) {
  const today = startOfMyDay(now);
  const end = new Date(today.getTime() + DAY);
  if (period === "today") return { from: today, to: end, prevFrom: new Date(today.getTime() - DAY), prevTo: today, label: formatDate(now.toISOString(), { weekday: "short", day: "numeric", month: "short" }), prevLabel: "yesterday" };
  if (period === "month") {
    const from = startOfMyMonth(now);
    const prevFrom = startOfMyMonth(new Date(from.getTime() - DAY));
    return { from, to: end, prevFrom, prevTo: new Date(prevFrom.getTime() + (end.getTime() - from.getTime())), label: formatDate(now.toISOString(), { month: "long", year: "numeric" }), prevLabel: "same days last month" };
  }
  const from = startOfMyWeek(now);
  return { from, to: end, prevFrom: new Date(from.getTime() - 7 * DAY), prevTo: new Date(end.getTime() - 7 * DAY), label: formatDate(from.toISOString()) + " – " + formatDate(today.toISOString()), prevLabel: "same days last week" };
}

function within(iso: string | null, from: Date, to: Date) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
}

function change(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function computeKpis(orders: ServiceOrder[], completions: ServiceCompletion[], period: KpiPeriod, technicians: string[]) {
  const b = periodBounds(period);
  const current = completions.filter((c) => within(c.completedAt, b.from, b.to));
  const previous = completions.filter((c) => within(c.completedAt, b.prevFrom, b.prevTo));
  const revenue = current.reduce((s, c) => s + c.finalAmount, 0);
  const prevRevenue = previous.reduce((s, c) => s + c.finalAmount, 0);
  const orderByNo = new Map(orders.map((o) => [o.orderNo, o]));

  const scheduledInPeriod = orders.filter((o) => within(o.scheduledAt, b.from, b.to));
  const reschedules = scheduledInPeriod.reduce((s, o) => s + o.rescheduleCount, 0);
  const prevReschedules = orders.filter((o) => within(o.scheduledAt, b.prevFrom, b.prevTo)).reduce((s, o) => s + o.rescheduleCount, 0);

  // Daily bars: last 7 days for today/week, every day so far for month.
  const days: Array<{ key: string; label: string; jobs: number; rescheduled: number }> = [];
  const start = period === "month" ? b.from : new Date(startOfMyDay().getTime() - 6 * DAY);
  for (let t = start.getTime(); t < b.to.getTime(); t += DAY) {
    const key = dayKey(new Date(t));
    days.push({
      key,
      label: period === "month" ? String(Number(key.slice(8))) : formatDate(new Date(t).toISOString(), { weekday: "short" }),
      jobs: completions.filter((c) => dayKey(c.completedAt) === key).length,
      rescheduled: orders.filter((o) => o.rescheduleCount > 0 && o.scheduledAt && dayKey(o.scheduledAt) === key).reduce((s, o) => s + o.rescheduleCount, 0)
    });
  }

  const branches = new Map<string, number>();
  for (const c of current) {
    const branch = orderByNo.get(c.orderNo)?.branch ?? "Other";
    branches.set(branch, (branches.get(branch) ?? 0) + 1);
  }

  const board = technicians.map((name) => {
    const mine = current.filter((c) => c.technicianName === name);
    const amount = mine.reduce((s, c) => s + c.finalAmount, 0);
    const open = orders.filter((o) => o.assignedTechnician === name && (o.status === "Assigned" || o.status === "In Progress")).length;
    const resched = scheduledInPeriod.filter((o) => o.assignedTechnician === name).reduce((s, o) => s + o.rescheduleCount, 0);
    const flagged = mine.filter((c) => c.files.length === 0 || c.finalAmount >= (orderByNo.get(c.orderNo)?.quotedPrice ?? 0) * 1.25).length;
    return { name, jobs: mine.length, amount, open, reschedules: resched, flagged, avgTicket: mine.length ? amount / mine.length : 0 };
  });
  const average = board.length ? board.reduce((s, t) => s + t.jobs, 0) / board.length : 0;
  const leaderboard = board
    .map((t) => ({ ...t, ratio: average ? t.jobs / average : 0, overloaded: average > 0 && t.jobs >= average * 1.5 && t.jobs >= 3 }))
    .sort((a, b2) => b2.jobs - a.jobs || b2.amount - a.amount);

  return {
    bounds: b,
    jobs: current.length,
    jobsChange: change(current.length, previous.length),
    revenue,
    revenueChange: change(revenue, prevRevenue),
    avgTicket: current.length ? revenue / current.length : 0,
    reschedules,
    reschedulesChange: reschedules - prevReschedules,
    awaitingReview: orders.filter((o) => o.status === "Job Done").length,
    days,
    branches: [...branches.entries()].sort((a, b2) => b2[1] - a[1]),
    leaderboard,
    average
  };
}
