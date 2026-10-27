import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import type { AppRole } from "@/lib/workflow";

export const runtime = "nodejs";

/** One-click reviewer sign-in. Returns a real Supabase session; no email is sent. */
export async function POST(request: Request) {
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!password) return NextResponse.json({ configured: false, fallback: "demo" });

  const { role } = (await request.json().catch(() => ({}))) as { role?: AppRole };
  const account = role ? DEMO_ACCOUNTS[role] : undefined;
  if (!account) return NextResponse.json({ error: "Unknown role." }, { status: 400 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await db.auth.signInWithPassword({ email: account.email, password });
  if (error || !data.session) return NextResponse.json({ error: error?.message || "Sign-in failed.", fallback: "demo" }, { status: 401 });

  return NextResponse.json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
}
