import { handle } from "@/lib/server/http";
import { createOrder } from "@/lib/server/orders";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handle(request, (actor, body) => createOrder(actor, body));
}
