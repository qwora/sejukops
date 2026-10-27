import { handle } from "@/lib/server/http";
import { runAction } from "@/lib/server/orders";
import type { WorkflowAction } from "@/lib/workflow";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  return handle(request, (actor, body) => runAction(actor, orderNo, String(body.action) as WorkflowAction, body));
}
