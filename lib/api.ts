"use client";

import { supabase } from "@/lib/supabase/client";
import { DEMO_ROLE_KEY, DEMO_TECH_KEY } from "@/lib/session";

/** POST to our API routes with the caller's identity (account token or demo role). */
export async function apiPost<T = unknown>(path: string, body: unknown = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers.Authorization = "Bearer " + data.session.access_token;
  } else {
    try {
      const role = window.sessionStorage.getItem(DEMO_ROLE_KEY);
      const tech = window.sessionStorage.getItem(DEMO_TECH_KEY);
      if (role) headers["x-demo-role"] = role;
      if (tech) headers["x-demo-technician"] = tech;
    } catch {
      /* ignore */
    }
  }
  const response = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  const json = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(json.error || "Request failed (" + response.status + ").");
  return json;
}
