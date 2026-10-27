import { handle } from "@/lib/server/http";
import { markNotification } from "@/lib/server/orders";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(request, (actor, body) => markNotification(actor, id, body.status === "read" ? "read" : "sent"));
}
