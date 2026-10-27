"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { getProfile, type AppRole } from "@/lib/supabase/auth";

export const DEMO_ROLE_KEY = "sejuksejuk.demo.role";
export const DEMO_TECH_KEY = "sejuksejuk.demo.technician";

export type Session = {
  loading: boolean;
  mode: "account" | "demo" | "none";
  role: AppRole | null;
  name: string;
  email: string | null;
  technicianName: string | null;
  accessToken: string | null;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

function readDemo() {
  try {
    const role = window.sessionStorage.getItem(DEMO_ROLE_KEY) as AppRole | null;
    const tech = window.sessionStorage.getItem(DEMO_TECH_KEY);
    return role ? { role, tech } : null;
  } catch {
    return null;
  }
}

export function startDemo(role: AppRole, technician?: string) {
  try {
    window.sessionStorage.setItem(DEMO_ROLE_KEY, role);
    if (technician) window.sessionStorage.setItem(DEMO_TECH_KEY, technician);
    else window.sessionStorage.removeItem(DEMO_TECH_KEY);
  } catch {
    /* storage blocked: demo still works for this page */
  }
}

export function clearDemo() {
  try {
    window.sessionStorage.removeItem(DEMO_ROLE_KEY);
    window.sessionStorage.removeItem(DEMO_TECH_KEY);
  } catch {
    /* ignore */
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<Session, "refresh">>({
    loading: true, mode: "none", role: null, name: "", email: null, technicianName: null, accessToken: null
  });

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session?.user) {
      try {
        const profile = await getProfile(session.user.id, { name: session.user.user_metadata?.name, email: session.user.email, role: session.user.user_metadata?.role });
        let technicianName: string | null = null;
        if (profile.role === "technician") {
          const { data: tech } = await supabase.from("technicians").select("name").eq("profile_id", profile.id).maybeSingle();
          technicianName = tech?.name ?? null;
        }
        setState({ loading: false, mode: "account", role: profile.role, name: profile.name, email: profile.email, technicianName, accessToken: session.access_token });
        return;
      } catch {
        /* fall through to demo */
      }
    }
    const demo = readDemo();
    if (demo) {
      const label = demo.role.charAt(0).toUpperCase() + demo.role.slice(1);
      setState({
        loading: false, mode: "demo", role: demo.role,
        name: demo.role === "technician" ? demo.tech || "Ali" : "Demo " + label,
        email: null, technicianName: demo.role === "technician" ? demo.tech || "Ali" : null, accessToken: null
      });
      return;
    }
    setState({ loading: false, mode: "none", role: null, name: "", email: null, technicianName: null, accessToken: null });
  }, []);

  useEffect(() => {
    load();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") load();
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const value = useMemo(() => ({ ...state, refresh: load }), [state, load]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
