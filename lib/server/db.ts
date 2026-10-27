import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client. Uses the public anon key and, when present, the caller's
 * access token so Row Level Security sees the real user. No service-role key is needed.
 */
export function serverClient(accessToken?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: "Bearer " + accessToken } } : undefined
  });
}
