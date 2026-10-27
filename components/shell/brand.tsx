import { cx } from "@/components/ui/primitives";

export function BrandMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={cx("inline-flex flex-none items-center justify-center rounded-lg bg-brand", className)} style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v20M4.9 6l14.2 12M19.1 6 4.9 18M2 12h20" />
      </svg>
    </span>
  );
}
