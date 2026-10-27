import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/server/actor";
import { serverClient } from "@/lib/server/db";
import { chat, gatewayToken } from "@/lib/server/ai/gateway";
import { COMPLETION_SELECT, ORDER_SELECT, toCompletion, toOrder } from "@/lib/supabase/mappers";
import { supervisorFlags } from "@/lib/supervisor";

export const runtime = "nodejs";

/**
 * AI Workflow Supervisor: rule flags + comparable jobs → short recommendation for the manager.
 * The model only sees this job's record and aggregate numbers, never other customers' details.
 */
export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const actor = await resolveActor(request);
  if (!actor) return NextResponse.json({ error: "Sign in or choose a demo role first." }, { status: 401 });
  if (actor.role !== "manager" && actor.role !== "admin") return NextResponse.json({ error: "Managers only." }, { status: 403 });

  const db = serverClient(actor.accessToken);
  const { data: orderRow } = await db.from("orders").select(ORDER_SELECT).eq("order_no", orderNo).maybeSingle();
  if (!orderRow) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const order = toOrder(orderRow);
  const { data: completionRow } = await db.from("service_completions").select(COMPLETION_SELECT).eq("order_id", order.id).maybeSingle();
  if (!completionRow) return NextResponse.json({ error: "This job has not been completed yet." }, { status: 409 });
  const completion = toCompletion(completionRow);
  const flags = supervisorFlags(order, completion);

  // Comparable jobs: same service type, last 60 days (aggregates only)
  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const { data: similar } = await db
    .from("service_completions")
    .select("final_amount, extra_charges, orders!inner(service_type)")
    .eq("orders.service_type", order.serviceType)
    .gte("completed_at", since)
    .neq("order_id", order.id)
    .limit(200);
  const amounts = (similar ?? []).map((row) => Number(row.final_amount)).sort((a, b) => a - b);
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : null;

  const facts = {
    order: order.orderNo,
    service: order.serviceType,
    quoted: order.quotedPrice,
    final: completion.finalAmount,
    extras: completion.extraItems.length ? completion.extraItems : completion.extraCharges ? [{ label: "Extra charges", amount: completion.extraCharges }] : [],
    workDone: completion.workDone,
    remarks: completion.remarks,
    evidenceFiles: completion.files.length,
    receiptPhoto: Boolean(completion.receipt),
    paymentReceived: completion.paymentAmount,
    paymentMethod: completion.paymentMethod,
    ruleFlags: flags.map((flag) => `${flag.level}: ${flag.title}`),
    comparableJobs: { count: amounts.length, medianFinal: median }
  };

  const rulesOnly = {
    recommendation: flags.some((f) => f.level === "high") ? "check" : flags.length ? "check" : "approve",
    summary: flags.length ? flags.map((f) => f.title).join(". ") + "." : "No issues found by the rule checks. Amount, evidence and payment look consistent.",
    source: "rules" as const,
    facts
  };

  const token = gatewayToken(request);
  if (!token) return NextResponse.json(rulesOnly);

  try {
    const result = await chat(
      token,
      [
        {
          role: "system",
          content:
            'You are a service operations supervisor reviewing one completed aircond job for a manager in Malaysia. Use ONLY the JSON facts. Never invent facts. All amounts are Malaysian Ringgit: always write them as RM 380.00, never $. Return JSON {"recommendation":"approve"|"check","summary":"2-3 short plain sentences: the verdict, the main reason with exact numbers, and what to check if anything"}. Recommend "check" if any rule flag is high, if the final amount is far above the comparable median, if extras are not explained by the work done, or if evidence is missing.'
        },
        { role: "user", content: JSON.stringify(facts) }
      ],
      { json: true, maxTokens: 220 }
    );
    const parsed = JSON.parse(result.content.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as { recommendation?: string; summary?: string };
    if (!parsed.summary) return NextResponse.json(rulesOnly);
    return NextResponse.json({
      recommendation: parsed.recommendation === "approve" && !flags.some((f) => f.level === "high") ? "approve" : "check",
      summary: String(parsed.summary).slice(0, 600),
      source: "ai",
      model: result.model,
      facts
    });
  } catch {
    return NextResponse.json(rulesOnly);
  }
}
