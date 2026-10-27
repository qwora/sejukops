import { NextResponse } from "next/server";
import { resolveActor, type Actor } from "./actor";
import { WorkflowError } from "./orders";

/** Shared wrapper: resolves the caller, runs the handler, turns errors into clean JSON. */
export async function handle(request: Request, run: (actor: Actor, body: Record<string, unknown>) => Promise<unknown>) {
  try {
    const actor = await resolveActor(request);
    if (!actor) return NextResponse.json({ error: "Sign in or choose a demo role first." }, { status: 401 });
    const body = request.headers.get("content-type")?.includes("application/json") ? ((await request.json()) as Record<string, unknown>) : {};
    const result = await run(actor, body ?? {});
    return NextResponse.json(result ?? { ok: true });
  } catch (error) {
    if (error instanceof WorkflowError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "Something went wrong.";
    console.error("[api]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
