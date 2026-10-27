import { serverClient } from "./db";
import type { AppRole } from "@/lib/workflow";

export type Actor = {
  role: AppRole;
  name: string;
  profileId: string | null;
  technicianName: string | null;
  mode: "account" | "demo";
  accessToken: string | null;
};

const ROLES: AppRole[] = ["admin", "technician", "manager"];

/**
 * Works out who is calling.
 * - Signed-in users: verified with Supabase Auth, role read from their profile.
 * - Demo mode (assessment reviewers without an account): role comes from the demo header.
 */
export async function resolveActor(request: Request): Promise<Actor | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (token) {
    const db = serverClient(token);
    const { data: userData, error } = await db.auth.getUser(token);
    if (error || !userData.user) return null;
    const { data: profile } = await db.from("profiles").select("id, full_name, role").eq("id", userData.user.id).maybeSingle();
    if (!profile) return null;
    let technicianName: string | null = null;
    if (profile.role === "technician") {
      const { data: tech } = await db.from("technicians").select("name").eq("profile_id", profile.id).maybeSingle();
      technicianName = tech?.name ?? null;
    }
    return { role: profile.role as AppRole, name: profile.full_name, profileId: profile.id, technicianName, mode: "account", accessToken: token };
  }

  const demoRole = request.headers.get("x-demo-role") as AppRole | null;
  if (demoRole && ROLES.includes(demoRole)) {
    const demoTech = request.headers.get("x-demo-technician");
    const label = demoRole.charAt(0).toUpperCase() + demoRole.slice(1);
    return {
      role: demoRole,
      name: demoRole === "technician" && demoTech ? demoTech : "Demo " + label,
      profileId: null,
      technicianName: demoRole === "technician" ? demoTech || "Ali" : null,
      mode: "demo",
      accessToken: null
    };
  }

  return null;
}
