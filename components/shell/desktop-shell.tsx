"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeftRight, BarChart3, ClipboardCheck, Home, LogOut, Menu, PlusCircle, ReceiptText, Search, Sparkles, X } from "lucide-react";
import { useLogOut, useSession } from "@/lib/session";
import type { AppRole } from "@/lib/supabase/auth";
import { listOrders } from "@/lib/data";
import { BrandMark } from "./brand";
import { RoleGuard } from "./role-guard";
import { NotificationBell } from "./notification-bell";
import { OperationsAssistant } from "@/components/operations-assistant";
import { Avatar, cx } from "@/components/ui/primitives";
import { branchOptions } from "@/lib/order-types";

type NavItem = { label: string; href: string; icon: ReactNode; roles: AppRole[]; badge?: "new" | "review"; indent?: boolean };

const NAV: NavItem[] = [
  { label: "Orders", href: "/admin/orders", icon: <ReceiptText className="h-[18px] w-[18px]" />, roles: ["admin", "manager"], badge: "new" },
  { label: "Create order", href: "/admin/orders/new", icon: <PlusCircle className="h-[18px] w-[18px]" />, roles: ["admin"], indent: true },
  { label: "Review queue", href: "/manager/reviews", icon: <ClipboardCheck className="h-[18px] w-[18px]" />, roles: ["manager", "admin"], badge: "review" },
  { label: "Performance", href: "/manager/dashboard", icon: <BarChart3 className="h-[18px] w-[18px]" />, roles: ["manager", "admin"] },
  { label: "Ops assistant", href: "/manager/assistant", icon: <Sparkles className="h-[18px] w-[18px]" />, roles: ["manager", "admin"] }
];

const branchColors = ["#2E7BAA", "#0E7490", "#C2620A", "#6D4FC2", "#B42318"];

export function DesktopShell({ roles, children, assistant = true }: { roles: AppRole[]; children: ReactNode; assistant?: boolean }) {
  return (
    <RoleGuard roles={roles}>
      <ShellFrame assistant={assistant}>{children}</ShellFrame>
    </RoleGuard>
  );
}

function ShellFrame({ children, assistant }: { children: ReactNode; assistant: boolean }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState({ new: 0, review: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listOrders()
      .then((orders) => setCounts({ new: orders.filter((o) => o.status === "New").length, review: orders.filter((o) => o.status === "Job Done").length }))
      .catch(() => undefined);
  }, [pathname]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const role = session.role ?? "admin";
  const items = NAV.filter((item) => item.roles.includes(role));
  const home = role === "manager" ? "/manager/reviews" : "/admin/orders";

  const logOut = useLogOut();

  function search(event: React.FormEvent) {
    event.preventDefault();
    router.push("/admin/orders" + (query.trim() ? "?q=" + encodeURIComponent(query.trim()) : ""));
  }

  const isActive = (href: string) => (href === "/admin/orders" ? pathname === href || (pathname.startsWith("/admin/orders/") && !pathname.endsWith("/new")) : pathname.startsWith(href));

  const nav = (
    <nav className="flex h-full flex-col gap-0.5 px-2 py-3" aria-label="Main">
      <Link href={home} className="flex h-9 items-center gap-2.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-white/70">
        <Home className="h-[18px] w-[18px]" aria-hidden />Home
      </Link>
      {items.map((item) => {
        const active = isActive(item.href);
        const badge = item.badge === "new" ? counts.new : item.badge === "review" ? counts.review : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex h-9 items-center gap-2.5 rounded-full px-3 text-[13px] text-ink-2 transition",
              item.indent ? "pl-[38px] font-normal text-ink-muted" : "font-medium",
              active ? "bg-white font-semibold text-ink shadow-card" : "hover:bg-white/70"
            )}
          >
            {!item.indent && <span aria-hidden>{item.icon}</span>}
            {item.label}
            {badge > 0 && <span className={cx("num ml-auto rounded-md px-1.5 text-[11px] font-semibold", item.badge === "new" ? "bg-brand text-white" : "bg-white text-ink-muted")}>{badge}</span>}
          </Link>
        );
      })}
      <div className="mx-3 my-2.5 h-px bg-line-strong" />
      <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Branches</span>
      {branchOptions.map((branch, i) => (
        <Link key={branch} href={"/admin/orders?branch=" + encodeURIComponent(branch)} className="flex h-9 items-center gap-2.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-white/70">
          <span className="mx-[5px] h-2 w-2 rounded-[3px]" style={{ background: branchColors[i] }} aria-hidden />
          {branch}
        </Link>
      ))}
      <div className="mt-auto space-y-0.5 pt-4">
        {session.mode === "demo" && <p className="px-2.5 pb-1 text-[11px] leading-snug text-ink-faint">Demo mode · actions are saved to the live database</p>}
        <Link href="/login" className="flex h-9 w-full items-center gap-2.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-white/70">
          <ArrowLeftRight className="h-[18px] w-[18px]" aria-hidden />Switch role
        </Link>
        <button onClick={logOut} className="flex h-9 w-full items-center gap-2.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-white/70">
          <LogOut className="h-[18px] w-[18px]" aria-hidden />Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-topbar px-3 md:px-4">
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href={home} className="flex items-center gap-2.5 lg:w-[224px]">
          <BrandMark size={24} className="text-white" />
          <span className="hidden text-[16px] font-light tracking-tight text-white sm:inline">Sejuk <span className="font-medium">Ops</span></span>
        </Link>
        <form onSubmit={search} className="hidden max-w-[520px] flex-1 md:block" role="search">
          <label className="flex h-9 items-center gap-2 rounded-full border border-navy-line bg-navy-field px-4 text-frost focus-within:ring-1 focus-within:ring-brand-glow/60">
            <Search className="h-4 w-4" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search orders" placeholder="Search orders, customers, phone numbers" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none font-light placeholder:text-ink-faint" />
          </label>
        </form>
        <div className="ml-auto flex items-center gap-2.5">
          <NotificationBell orderHref={(orderNo) => (role === "manager" ? "/manager/reviews/" + orderNo : "/admin/orders/" + orderNo)} />
          <div className="flex h-9 items-center gap-2 rounded-full border border-navy-line bg-navy-field pl-1 pr-3.5">
            <Avatar name={session.name} size={26} />
            <span className="hidden text-[13px] font-medium text-white sm:inline">{session.name}</span>
            <span className="hidden text-xs capitalize text-ink-faint md:inline">{role}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[240px] flex-none overflow-y-auto bg-rail lg:block">{nav}</aside>
        {menuOpen && (
          <div className="fixed inset-0 top-14 z-30 lg:hidden" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <aside className="relative h-full w-[260px] overflow-y-auto bg-rail shadow-xl" onClick={(e) => e.stopPropagation()}>{nav}</aside>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 pb-16 pt-5 md:px-8 md:pt-6">{children}</main>
      </div>
      {assistant && (role === "manager" || role === "admin") && <OperationsAssistant />}
    </div>
  );
}

export function PageHeader({ title, subtitle, back, actions, meta }: { title: ReactNode; subtitle?: ReactNode; back?: string; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {back && (
        <Link href={back} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-2 shadow-card hover:bg-rail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
      )}
      <h1 className="text-[28px] font-extralight leading-tight tracking-tight text-ink">{title}</h1>
      {meta}
      {subtitle && <span className="text-[13px] text-ink-muted">{subtitle}</span>}
      {actions && <div className="ml-auto flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
