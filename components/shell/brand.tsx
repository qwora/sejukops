import { MARK_PATHS, MARK_VIEWBOX } from "@/lib/brand";
import { cx } from "@/components/ui/primitives";

/** The Sejuk Sejuk mark. Takes the current text colour. */
export function BrandMark({ size = 24, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={Math.round(size * (175 / 167))}
      className={cx("flex-none", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {MARK_PATHS.map((d) => (
        <path key={d} fill="currentColor" d={d} />
      ))}
    </svg>
  );
}

/** Mark + "Sejuk Ops" wordmark. */
export function BrandLockup({ size = 24, className, tone = "light" }: { size?: number; className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", tone === "light" ? "text-white" : "text-navy", className)}>
      <BrandMark size={size} className={tone === "dark" ? "text-brand" : undefined} />
      <span className="text-[16px] font-light tracking-tight">
        Sejuk <span className="font-medium">Ops</span>
      </span>
    </span>
  );
}
