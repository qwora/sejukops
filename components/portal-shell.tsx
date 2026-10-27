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

export function PortalShell({ children, role, active }: PortalShellProps) {
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="portal-shell flex">
      <aside className="portal-sidebar flex min-h-screen flex-col px-3 py-5 md:px-4">
        <Link href="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dff7eb] font-bold text-[#10233f]">S</span>
          <span className="brand-label font-semibold">Sejuk Sejuk</span>
        </Link>

        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-xl px-3 py-3 text-sm transition ${active === item.label ? "bg-white/15 font-semibold text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer mt-auto border-t border-white/10 px-2 pt-5 text-xs text-white/45">
          Assessment workspace
        </div>
      </aside>

      <main className="portal-content flex-1">{children}</main>
    </div>
  );
}
