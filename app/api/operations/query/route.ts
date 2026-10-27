import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/server/actor";
import { serverClient } from "@/lib/server/db";
import { chat, gatewayToken } from "@/lib/server/ai/gateway";
import { classifyWithRules, INTENT_GUIDE, sanitizeIntent, type Intent } from "@/lib/server/ai/intents";
import { runIntent } from "@/lib/server/ai/queries";
import { dayKey } from "@/lib/format";

export const runtime = "nodejs";

const UNSUPPORTED =
  "I can only answer questions about Sejuk Sejuk service records: completed jobs, technicians, revenue, the review queue, unassigned orders, workload and flagged jobs. Try one of the suggested questions.";

/** Guard against the model dropping or changing numbers: every figure in the verified headline must appear. */
function keepsKeyFigures(verified: string, candidate: string) {
  const norm = (s: string) => s.replace(/,/g, "");
  const headline = verified.split("\n")[0].replace(/\([^)]*\)/g, ""); // ignore date ranges in brackets
  const figures = norm(headline).match(/\d+(?:\.\d+)?/g) ?? [];
  const text = norm(candidate);
  return figures.every((figure) => text.includes(figure) || text.includes(String(Number(figure))));
}

/**
 * Operations query window.
 * 1. Interpret: AI picks one intent from a fixed list (rules as fallback).
 * 2. Retrieve: a typed, filtered Supabase query for that intent only.
 * 3. Format: AI words the answer from the returned rows only (deterministic text as fallback).
 */
export async function POST(request: Request) {
  const actor = await resolveActor(request);
  if (!actor) return NextResponse.json({ error: "Sign in or choose a demo role first." }, { status: 401 });
  if (actor.role !== "manager" && actor.role !== "admin") {
    return NextResponse.json({ error: "The operations assistant is for managers and admins." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { question?: string };
  const question = (body.question ?? "").trim().slice(0, 300);
  if (!question) return NextResponse.json({ error: "Ask a question about jobs, technicians or the review queue." }, { status: 400 });

  const token = gatewayToken(request);
  const trace: string[] = [];
  let intent: Intent | null = null;
  let interpretedBy: "ai" | "rules" = "rules";
  let model: string | null = null;

  if (token) {
    try {
      const result = await chat(
        token,
        [
          { role: "system", content: INTENT_GUIDE + `\nToday is ${dayKey(new Date())} (Malaysia time).` },
          { role: "user", content: question }
        ],
        { json: true, maxTokens: 120 }
      );
      const json = result.content.match(/\{[\s\S]*\}/)?.[0];
      intent = sanitizeIntent(json ? JSON.parse(json) : null);
      if (intent) {
        interpretedBy = "ai";
        model = result.model;
      }
    } catch (error) {
      trace.push("AI interpret failed: " + (error instanceof Error ? error.message.slice(0, 120) : "error"));
    }
  } else {
    trace.push("AI Gateway not configured; using rules.");
  }

  if (!intent) intent = classifyWithRules(question);

  if (intent.type === "unsupported") {
    return NextResponse.json({ supported: false, answer: UNSUPPORTED, intent: "unsupported", params: {}, columns: [], rows: [], interpretedBy, formattedBy: "rules", model, trace });
  }

  try {
    const db = serverClient(actor.accessToken);
    const result = await runIntent(db, intent);
    let answer = result.answer;
    let formattedBy: "ai" | "rules" = "rules";

    if (token) {
      try {
        const formatted = await chat(
          token,
          [
            {
              role: "system",
              content:
                "You write short answers for an air-conditioning service operations manager. Use ONLY the facts in the provided data. Never invent names, numbers, orders or dates. Keep every number and order number exactly as given. Plain text only: no markdown, no headings, no bullet symbols. Start with a direct answer that keeps every key figure from deterministicAnswer (counts, amounts, averages, ratios, periods). If the rows contain an Order column and there are 6 or fewer rows, list each as 'ORDER1234 – detail' on its own line. Do not add a list for rankings; the table is shown separately. Reply in the language of the question. If there are no rows, say so plainly."
            },
            { role: "user", content: JSON.stringify({ question, intent, deterministicAnswer: result.answer, rows: result.rows.slice(0, 20) }) }
          ],
          { maxTokens: 300 }
        );
        const cleaned = formatted.content.replace(/[ \t]+$/gm, "").replace(/\*\*/g, "").trim();
        if (keepsKeyFigures(result.answer, cleaned)) {
          answer = cleaned;
          formattedBy = "ai";
          model = model ?? formatted.model;
        } else {
          trace.push("AI answer dropped key figures; using the verified answer.");
        }
      } catch (error) {
        trace.push("AI format failed: " + (error instanceof Error ? error.message.slice(0, 120) : "error"));
      }
    }

    return NextResponse.json({
      supported: true,
      answer,
      intent: intent.type,
      params: result.params,
      range: result.range ?? null,
      columns: result.columns,
      rows: result.rows,
      interpretedBy,
      formattedBy,
      model,
      trace
    });
  } catch (error) {
    console.error("[operations/query]", error);
    return NextResponse.json({ error: "Could not query operational data right now." }, { status: 500 });
  }
}
