import { supabase } from "@/lib/supabase/client";

export type AppRole = "admin" | "technician" | "manager";

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

export async function ensureProfile(input: {
  id: string;
  name?: string;
  email?: string | null;
  role?: AppRole;
}) {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id,name,email,role,branch,phone")
    .eq("id", input.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing as Profile;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: input.id,
      name: input.name || input.email?.split("@")[0] || "Workspace user",
      email: input.email || null,
      role: input.role || "admin"
    })
    .select("id,name,email,role,branch,phone")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getCurrentProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  return ensureProfile({
    id: userData.user.id,
    name: userData.user.user_metadata?.name,
    email: userData.user.email,
    role: userData.user.user_metadata?.role as AppRole | undefined
  });
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return a signed-in user.");

  const profile = await ensureProfile({
    id: data.user.id,
    name: data.user.user_metadata?.name,
    email: data.user.email,
    role: data.user.user_metadata?.role as AppRole | undefined
  });

  return profile;
}

export async function signUpWithPassword(input: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
}) {
  const emailRedirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/login?confirmed=1` : undefined;

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: { name: input.name, role: input.role }
    }
  });

  if (error) throw error;
  if (data.session && data.user) {
    await ensureProfile({ id: data.user.id, name: input.name, email: input.email, role: input.role });
  }

  return { needsEmailConfirmation: !data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
