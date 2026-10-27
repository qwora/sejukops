/**
 * Vercel AI Gateway (OpenAI-compatible). Auth order:
 * 1. AI_GATEWAY_API_KEY (local dev or explicit key)
 * 2. The OIDC token Vercel injects into every deployed function request (no key needed)
 */
const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";

// Cheap, fast models first. Free-tier AI Gateway credit only covers some models, so we try in order
// and remember which one works (and which are blocked) for the life of the function instance.
const DEFAULT_MODELS = [
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-4.1-nano",
  "google/gemini-2.5-flash",
  "mistral/ministral-8b",
  "alibaba/qwen-3-14b",
  "nvidia/nemotron-3.5-lightning-free"
];

let preferred: string | null = null;
const blocked = new Set<string>();

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string | Array<Record<string, unknown>> };

export function gatewayToken(request?: Request) {
  return process.env.AI_GATEWAY_API_KEY || request?.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN || null;
}

export function aiModels() {
  const configured = process.env.AI_MODEL?.split(",").map((item) => item.trim()).filter(Boolean);
  return configured?.length ? configured : DEFAULT_MODELS;
}

export async function chat(token: string, messages: ChatMessage[], options: { json?: boolean; maxTokens?: number } = {}) {
  let lastError = "";
  const errors: string[] = [];
  const candidates = aiModels().filter((model) => !blocked.has(model));
  const ordered = preferred && candidates.includes(preferred) ? [preferred, ...candidates.filter((m) => m !== preferred)] : candidates;
  for (const model of ordered) {
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
        const text = (await response.text()).slice(0, 160);
        if (response.status === 403 || response.status === 404) blocked.add(model);
        lastError = model + ": " + response.status + " " + text;
        errors.push(model + " " + response.status);
        continue;
      }
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = body.choices?.[0]?.message?.content?.trim();
      if (content) {
        preferred = model;
        return { content, model };
      }
      lastError = model + ": empty response";
      errors.push(model + " empty");
    } catch (error) {
      lastError = model + ": " + (error instanceof Error ? error.message : "request failed");
      errors.push(model + " error");
    }
  }
  throw new Error((errors.length > 1 ? "tried " + errors.join(", ") + " · last: " : "") + (lastError || "AI Gateway unavailable"));
}
