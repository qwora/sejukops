import { supabase } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/workflow";

export type { AppRole };

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  role: AppRole;
  branch: string | null;
  phone: string | null;
};

export const roleDestinations: Record<AppRole, string> = {
  admin: "/admin/orders",
  technician: "/technician/jobs",
  manager: "/manager/reviews"
};

export function roleLabel(role: AppRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

type ProfileRow = { id: string; full_name: string; email: string | null; role: AppRole; branch: string | null; phone: string | null };

function toProfile(row: ProfileRow): Profile {
  return { id: row.id, name: row.full_name, email: row.email, role: row.role, branch: row.branch, phone: row.phone };
}

/** Profiles are created by a database trigger on signup. This only falls back if the trigger row is missing. */
export async function getProfile(userId: string, fallback?: { name?: string; email?: string | null; role?: AppRole }) {
  const { data, error } = await supabase.from("profiles").select("id,full_name,email,role,branch,phone").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data) return toProfile(data as ProfileRow);

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, full_name: fallback?.name || fallback?.email?.split("@")[0] || "Workspace user", email: fallback?.email ?? null, role: fallback?.role || "admin" })
    .select("id,full_name,email,role,branch,phone")
    .single();
  if (insertError) throw insertError;
  return toProfile(created as ProfileRow);
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return a signed-in user.");
  return getProfile(data.user.id, { name: data.user.user_metadata?.name, email: data.user.email, role: data.user.user_metadata?.role });
}

export async function signUpWithPassword(input: { name: string; email: string; password: string; role: AppRole }) {
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/login?confirmed=1` : undefined;
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo, data: { name: input.name, role: input.role } }
  });
  if (error) throw error;
  return { needsEmailConfirmation: !data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
