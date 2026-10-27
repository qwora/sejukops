/**
 * Vercel AI Gateway (OpenAI-compatible). Auth order:
 * 1. AI_GATEWAY_API_KEY (local dev or explicit key)
 * 2. The OIDC token Vercel injects into every deployed function request (no key needed)
 */
const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";

const DEFAULT_MODELS = ["google/gemini-3.7-flash", "openai/gpt-6.1-terra", "deepseek/deepseek-v4.1-flash-1017"];

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function gatewayToken(request?: Request) {
  return process.env.AI_GATEWAY_API_KEY || request?.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN || null;
}

export function aiModels() {
  const configured = process.env.AI_MODEL?.split(",").map((item) => item.trim()).filter(Boolean);
  return configured?.length ? configured : DEFAULT_MODELS;
}

export async function chat(token: string, messages: ChatMessage[], options: { json?: boolean; maxTokens?: number } = {}) {
  let lastError = "";
  for (const model of aiModels()) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          max_tokens: options.maxTokens ?? 500,
          ...(options.json ? { response_format: { type: "json_object" } } : {})
        })
      });
      clearTimeout(timer);
      if (!response.ok) {
        lastError = model + ": " + response.status + " " + (await response.text()).slice(0, 200);
        continue;
      }
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = body.choices?.[0]?.message?.content?.trim();
      if (content) return { content, model };
      lastError = model + ": empty response";
    } catch (error) {
      lastError = model + ": " + (error instanceof Error ? error.message : "request failed");
    }
  }
  throw new Error(lastError || "AI Gateway unavailable");
}
