import { handle } from "@/lib/server/http";
import { completeOrder } from "@/lib/server/orders";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  return handle(request, (actor, body) => completeOrder(actor, orderNo, body));
}
