import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import type { OrderStatus } from "@/lib/order-types";
import { initials } from "@/lib/format";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "brand" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "bg-white text-ink shadow-sec hover:bg-[#F7FAFC]",
  brand: "bg-navy text-white hover:bg-navy-field",
  ghost: "text-ink-2 hover:bg-navy/5",
  danger: "bg-white text-danger shadow-sec hover:bg-danger-tint"
};
const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-[13px]", lg: "h-11 px-5 text-sm" };

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; loading?: boolean; icon?: ReactNode };

export function Button({ variant = "secondary", size = "md", loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx("inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-55", variants[variant], sizes[size], className)}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "secondary", size = "md", icon, className, children, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes; icon?: ReactNode }) {
  return (
    <Link {...rest} className={cx("inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition", variants[variant], sizes[size], className)}>
      {icon}
      {children}
    </Link>
  );
}

/* ---------- Status ---------- */

export const statusStyle: Record<OrderStatus, string> = {
  New: "bg-st-new-bg text-st-new-fg",
  Assigned: "bg-st-asg-bg text-st-asg-fg",
  "In Progress": "bg-st-prog-bg text-st-prog-fg",
  "Job Done": "bg-st-done-bg text-st-done-fg",
  Reviewed: "bg-st-rev-bg text-st-rev-fg",
  Closed: "bg-st-cls-bg text-st-cls-fg"
};

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cx("inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold", statusStyle[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "brand" | "warn" | "danger" | "ai" | "blue"; children: ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-rail text-ink-2",
    brand: "bg-ok-tint text-ok",
    warn: "bg-st-prog-bg text-st-prog-fg",
    danger: "bg-danger-tint text-danger",
    ai: "bg-st-rev-bg text-st-rev-fg",
    blue: "bg-st-asg-bg text-st-asg-fg"
  };
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone], className)}>{children}</span>;
}

const STEPS: OrderStatus[] = ["New", "Assigned", "In Progress", "Job Done", "Reviewed", "Closed"];

export function StatusStepper({ status }: { status: OrderStatus }) {
  const index = STEPS.indexOf(status);
  return (
    <ol className="card flex items-start px-2 py-4" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i < index || (i === index && status === "Closed");
        const current = i === index && status !== "Closed";
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={current ? "step" : undefined}>
            {i > 0 && <span className={cx("absolute right-1/2 top-[11px] h-0.5 w-full -translate-x-[11px]", i <= index ? "bg-navy" : "bg-line")} aria-hidden />}
            <span
              className={cx(
                "relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold",
                done && "bg-navy text-white",
                current && "bg-brand text-white ring-4 ring-brand/15",
                !done && !current && "bg-rail text-ink-faint"
              )}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden /> : i + 1}
            </span>
            <span className={cx("text-[11.5px] font-semibold", current ? "text-brand-ink" : done ? "text-ink-2" : "text-ink-faint")}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- People ---------- */

const techColors: Record<string, string> = { Ali: "#2E7BAA", John: "#0E7490", Bala: "#C2620A", Yusoff: "#6D4FC2" };
export function personColor(name: string) {
  if (techColors[name]) return techColors[name];
  const palette = ["#0E7490", "#BE185D", "#4D7C0F", "#9333EA", "#B45309"];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

export function Avatar({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  if (!name) {
    return <span className={cx("inline-flex flex-none items-center justify-center rounded-full bg-rail text-ink-faint", className)} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>–</span>;
  }
  return (
    <span className={cx("inline-flex flex-none items-center justify-center rounded-full font-bold text-white", className)} style={{ width: size, height: size, fontSize: size * 0.42, background: personColor(name) }} aria-hidden>
      {initials(name).slice(0, name.includes(" ") ? 2 : 1)}
    </span>
  );
}

/* ---------- Layout bits ---------- */

export function Card({ title, action, children, className, padded = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cx("card", padded && "flex flex-col gap-3 p-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "danger" | "brand" }) {
  return (
    <div className="px-4 py-3.5">
      <div className="text-xs font-medium text-ink-muted">{label}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className={cx("num whitespace-nowrap text-[26px] font-extralight tracking-tight", tone === "danger" ? "text-danger" : "text-ink")}>{value}</span>
        {note && <span className="text-xs text-ink-muted">{note}</span>}
      </div>
    </div>
  );
}

/* ---------- States ---------- */

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl bg-danger-tint px-4 py-3 text-[13px] text-danger">
      <AlertTriangle className="h-4 w-4 flex-none" aria-hidden />
      <span className="flex-1">{message}</span>
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Notice({ tone = "brand", children }: { tone?: "brand" | "warn"; children: ReactNode }) {
  return (
    <div role="status" className={cx("flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium animate-fade-up", tone === "brand" ? "bg-ok-tint text-ok" : "bg-warn-tint text-warn")}>
      {tone === "brand" && <Check className="h-4 w-4 flex-none" strokeWidth={3} aria-hidden />}
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-rail text-ink-muted">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body && <p className="max-w-sm text-[13px] text-ink-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-rail", className)} aria-hidden />;
}

export function PageLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card space-y-3 p-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}
