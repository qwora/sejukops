import type { AppRole } from "@/lib/workflow";

/** Reviewer accounts. Created in Supabase Auth; the shared password lives only in the DEMO_ACCOUNT_PASSWORD env var. */
export const DEMO_ACCOUNTS: Record<AppRole, { email: string; name: string }> = {
  admin: { email: "admin@demo.sejuksejuk.app", name: "Nurul Aisyah" },
  technician: { email: "ali@demo.sejuksejuk.app", name: "Ali" },
  manager: { email: "manager@demo.sejuksejuk.app", name: "Rizal Kamal" }
};
