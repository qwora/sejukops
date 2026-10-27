import { NextResponse } from "next/server";
import { ensureDemoData, listDbCompletions, listOrders } from "@/lib/supabase/operations";

export const runtime = "nodejs";

type QueryResult = { answer: string; supported: boolean; queryType: string; data?: unknown };

function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA");
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfWeek(date = new Date(), offset = 0) {
  const value = startOfDay(date);
  const day = value.getDay();
  value.setDate(value.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return value;
}

function formatWithRecords(question: string, answer: string, records: unknown[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Promise.resolve(null);
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Format answers using only the supplied operational records. Do not invent facts, names or numbers. Keep the response concise and mention when no matching records exist." },
        { role: "user", content: JSON.stringify({ question, deterministicAnswer: answer, records }) }
      ]
    })
  }).then(async (response) => {
    if (!response.ok) return null;
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return body.choices?.[0]?.message?.content?.trim() || null;
  }).catch(() => null);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { question?: string };
    const question = body.question?.trim() || "";
    if (!question) return NextResponse.json({ answer: "Ask a question about jobs, technicians or the review queue.", supported: false, queryType: "empty" }, { status: 400 });

    await ensureDemoData();
    const [orders, completions] = await Promise.all([listOrders(), listDbCompletions()]);
    const lower = question.toLowerCase();
    const technicianMatch = lower.match(/\b(ali|john|bala|yusoff)\b/i);
    const technician = technicianMatch ? technicianMatch[1].replace(/^./, (letter) => letter.toUpperCase()) : "";
    const currentWeek = startOfWeek();
    const previousWeek = startOfWeek(new Date(), -1);
    const nextWeek = startOfWeek(new Date(), 1);
    let type = "unsupported";
    let answer = "";
    let records: unknown[] = [];

    if (/waiting|awaiting|needs? review|job done/.test(lower)) {
      type = "awaiting_review";
      const matches = orders.filter((order) => order.status === "Job Done");
      records = matches.map((order) => ({ orderNo: order.orderNo, service: order.serviceType, technician: order.assignedTechnician || "Unknown" }));
      answer = matches.length ? matches.map((order) => order.orderNo + " – " + order.serviceType + " (" + (order.assignedTechnician || "unassigned") + ")").join("\n") : "No jobs are currently waiting for manager review.";
      if (matches.length) answer = matches.length + " job" + (matches.length === 1 ? " is" : "s are") + " waiting for manager review:\n" + answer;
    } else if (/most|top|highest/.test(lower) && /technician|jobs?/.test(lower)) {
      type = "top_technician_this_week";
      const thisWeek = completions.filter((item) => new Date(item.completedAt) >= currentWeek && new Date(item.completedAt) < nextWeek);
      const counts = new Map<string, number>();
      thisWeek.forEach((item) => counts.set(item.technicianName, (counts.get(item.technicianName) || 0) + 1));
      const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      records = ranked.map(([name, count]) => ({ technician: name, jobsCompleted: count }));
      answer = ranked.length ? ranked[0][0] + " completed the most jobs this week with " + ranked[0][1] + " job" + (ranked[0][1] === 1 ? "" : "s") + "." : "No completed jobs are recorded this week.";
    } else if (/how many|number of|count/.test(lower) && /today/.test(lower)) {
      type = "completed_today";
      const today = dayKey(new Date());
      const matches = completions.filter((item) => dayKey(new Date(item.completedAt)) === today);
      records = matches.map((item) => ({ orderNo: item.orderNo, technician: item.technicianName, service: item.workDone }));
      answer = matches.length + " job" + (matches.length === 1 ? " was" : "s were") + " completed today.";
    } else if (technician && /complete|finish|job/.test(lower)) {
      type = lower.includes("last week") ? "technician_last_week" : "technician_this_week";
      const from = type === "technician_last_week" ? previousWeek : currentWeek;
      const to = type === "technician_last_week" ? currentWeek : nextWeek;
      const matches = completions.filter((item) => item.technicianName.toLowerCase() === technician.toLowerCase() && new Date(item.completedAt) >= from && new Date(item.completedAt) < to);
      records = matches.map((item) => ({ orderNo: item.orderNo, service: item.workDone, completedAt: item.completedAt }));
      answer = matches.length ? technician + " completed " + matches.length + " job" + (matches.length === 1 ? "" : "s") + ":\n" + matches.map((item) => item.orderNo + " – " + item.workDone).join("\n") : technician + " has no completed jobs in that period.";
    } else {
      return NextResponse.json({ answer: "I can answer supported questions about completed jobs, technicians and the review queue. Try asking how many jobs were completed today, who completed the most jobs this week, or which jobs are waiting for review.", supported: false, queryType: type });
    }

    const formatted = await formatWithRecords(question, answer, records);
    const result: QueryResult = { answer: formatted || answer, supported: true, queryType: type, data: records };
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ answer: error instanceof Error ? error.message : "Could not query operational data.", supported: false, queryType: "error" }, { status: 500 });
  }
}
