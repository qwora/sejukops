import Link from "next/link";
import type { ReactNode } from "react";

type PortalShellProps = {
  children: ReactNode;
  role: "Admin" | "Technician" | "Manager";
  active: string;
};

const navItems = [
  { label: "Orders", href: "/admin/orders", roles: ["Admin"] },
  { label: "My jobs", href: "/technician/jobs", roles: ["Technician"] },
  { label: "Review queue", href: "/manager/reviews", roles: ["Manager"] },
  { label: "Dashboard", href: "/manager/dashboard", roles: ["Manager"] }
];

const workspaceCopy = {
  Admin: "Order operations",
  Technician: "Field service",
  Manager: "Reviews & performance"
};

export function PortalShell({ children, role, active }: PortalShellProps) {
  const items = navItems.filter((item) => item.roles.includes(role));
  const isTechnician = role === "Technician";

  return (
    <div className="portal-shell flex min-h-screen">
      <aside className={(isTechnician ? "hidden md:flex " : "flex ") + "portal-sidebar min-h-screen flex-col px-3 py-5 md:px-4"}>
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dff7eb] font-bold text-[#10233f]">S</span>
          <span className="brand-label font-semibold">Sejuk Sejuk</span>
        </Link>

        <div className="mb-8 rounded-2xl bg-white/10 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Dashboard</p>
          <p className="mt-1 text-sm font-semibold text-white">{role}</p>
          <p className="mt-1 text-xs text-white/55">{workspaceCopy[role]}</p>
        </div>

        <nav className="space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={"flex items-center rounded-xl px-3 py-3 text-sm transition " + (active === item.label ? "bg-white/15 font-semibold text-white" : "text-white/60 hover:bg-white/10 hover:text-white")}>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer mt-auto border-t border-white/10 px-2 pt-5 text-xs text-white/45">
          {role} dashboard · Assessment workspace
        </div>
      </aside>

      <main className="portal-content min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:hidden">
          <Link href={role === "Admin" ? "/admin/orders" : role === "Manager" ? "/manager/reviews" : "/technician/jobs"} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff7eb] font-bold text-[#10233f]">S</span>
            <span><span className="block text-sm font-semibold text-ink">{role} dashboard</span><span className="block text-xs text-slate-500">{workspaceCopy[role]}</span></span>
          </Link>
          <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-emerald-800">{role}</span>
        </header>
        {children}
      </main>
    </div>
  );
}
