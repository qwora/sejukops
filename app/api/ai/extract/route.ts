import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/server/actor";
import { chat, gatewayToken, type ChatMessage } from "@/lib/server/ai/gateway";
import { serviceOptions, branchOptions } from "@/lib/order-types";
import { isValidMyPhone, normalizeMyPhone } from "@/lib/phone";
import { dayKey } from "@/lib/format";

export const runtime = "nodejs";

const MAX_IMAGE_CHARS = 4_000_000; // ~3 MB image after base64

/**
 * AI Document Understanding: turn a job sheet / quotation photo or pasted message
 * into structured order fields. Output is validated; the admin reviews before saving.
 */
export async function POST(request: Request) {
  const actor = await resolveActor(request);
  if (!actor) return NextResponse.json({ error: "Sign in or choose a demo role first." }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Only Admin can create orders from documents." }, { status: 403 });

  const token = gatewayToken(request);
  if (!token) return NextResponse.json({ error: "AI is not configured in this environment. Fill the form manually." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { image?: string; text?: string };
  const image = typeof body.image === "string" && body.image.startsWith("data:image/") ? body.image : null;
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : "";
  if (!image && !text) return NextResponse.json({ error: "Upload a photo or paste some text." }, { status: 400 });
  if (image && image.length > MAX_IMAGE_CHARS) return NextResponse.json({ error: "Image is too large. Try a smaller photo." }, { status: 413 });

  const instruction = `Extract an air-conditioner service order from the document. Return JSON only with these keys:
customerName (string), customerPhone (string, as written), address (string), serviceType (one of: ${serviceOptions.join(", ")}; pick the closest), branch (one of: ${branchOptions.join(", ")} or ""; infer from the address if obvious), problemDescription (short, what is wrong / what is requested, include number of units), quotedPrice (number in RM, total, or null), serviceDate (YYYY-MM-DD or null), serviceTime (HH:MM 24h or null), notes (string: anything else useful, e.g. access instructions), confidence ("high"|"medium"|"low").
Use "" or null when a field is not in the document. Never invent values. Today is ${new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "long" })} ${dayKey(new Date())} (Malaysia). Resolve relative days (e.g. "Thursday", "Khamis", "esok", "tomorrow") to the next matching date on or after today. Text may be in Malay or English.`;

  try {
    const content: unknown = image
      ? [
          { type: "text", text: instruction + (text ? "\nExtra context from admin: " + text : "") },
          { type: "image_url", image_url: { url: image } }
        ]
      : instruction + "\n\nDocument:\n" + text;

    const result = await chat(token, [{ role: "user", content: content as ChatMessage["content"] }], { json: true, maxTokens: 500 });
    const json = result.content.match(/\{[\s\S]*\}/)?.[0];
    const raw = json ? (JSON.parse(json) as Record<string, unknown>) : {};

    const str = (value: unknown, max = 400) => (typeof value === "string" ? value.trim().slice(0, max) : "");
    const service = serviceOptions.find((option) => option.toLowerCase() === str(raw.serviceType).toLowerCase()) ?? "";
    const branch = branchOptions.find((option) => option.toLowerCase() === str(raw.branch).toLowerCase()) ?? "";
    const phone = str(raw.customerPhone, 30);
    const price = Number(raw.quotedPrice);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(str(raw.serviceDate)) ? str(raw.serviceDate) : "";
    const time = /^\d{2}:\d{2}$/.test(str(raw.serviceTime)) ? str(raw.serviceTime) : "";

    const fields = {
      customerName: str(raw.customerName, 120),
      customerPhone: phone && isValidMyPhone(phone) ? normalizeMyPhone(phone).replace(/^60/, "") : phone,
      address: str(raw.address),
      serviceType: service,
      branch,
      problemDescription: str(raw.problemDescription, 1000),
      quotedPrice: Number.isFinite(price) && price > 0 ? String(Math.round(price * 100) / 100) : "",
      scheduledAt: date ? `${date}T${time || "10:00"}` : "",
      adminNotes: str(raw.notes, 500)
    };
    const found = Object.entries(fields).filter(([, value]) => value).map(([key]) => key);

    return NextResponse.json({ fields, found, confidence: ["high", "medium", "low"].includes(String(raw.confidence)) ? raw.confidence : "medium", model: result.model });
  } catch (error) {
    console.error("[ai/extract]", error);
    return NextResponse.json({ error: "Could not read the document. Try a clearer photo or fill the form manually." }, { status: 502 });
  }
}
