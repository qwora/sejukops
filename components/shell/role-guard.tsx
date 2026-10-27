"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { roleDestinations, type AppRole } from "@/lib/supabase/auth";
import { LinkButton } from "@/components/ui/primitives";

/** Client-side route guard. Server routes re-check the role on every write. */
export function RoleGuard({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session.loading && session.mode === "none") router.replace("/login");
  }, [session.loading, session.mode, router]);

  if (session.loading || session.mode === "none") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading workspace" />
      </div>
    );
  }

  if (!session.role || !roles.includes(session.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="card max-w-sm space-y-3 p-6 text-center">
          <p className="text-sm font-semibold text-ink">This page isn&apos;t part of the {session.role} workspace</p>
          <p className="text-[13px] text-ink-muted">Go back to your workspace or switch role.</p>
          <div className="flex justify-center gap-2">
            {session.role && <LinkButton variant="primary" href={roleDestinations[session.role]}>My workspace</LinkButton>}
            <LinkButton href="/login">Switch role</LinkButton>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
