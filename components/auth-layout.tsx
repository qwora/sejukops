import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shell/brand";

const FLOW = ["New", "Assigned", "In progress", "Job done", "Reviewed", "Closed"];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <section className="relative flex flex-col gap-8 overflow-hidden bg-[#0F1F1A] px-6 py-8 text-white sm:px-10 lg:w-1/2 lg:px-14 lg:py-12">
        <div className="pointer-events-none absolute -right-40 top-44 h-[560px] w-[560px] rounded-full border border-brand-glow/20" aria-hidden />
        <div className="pointer-events-none absolute -right-20 top-64 h-[400px] w-[400px] rounded-full border border-brand-glow/15" aria-hidden />
        <Link href="/" className="relative flex items-center gap-2.5">
          <BrandMark size={34} />
          <span className="text-[17px] font-bold">Sejuk Ops</span>
        </Link>
        <div className="relative max-w-[460px] lg:mt-auto">
          <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">Every aircond job, from booking to review.</h1>
          <p className="mt-4 text-base leading-relaxed text-[#A9C2B8]">One place for 5 branches and 40+ technician teams to create, assign, complete and review service orders.</p>
        </div>
        <ol className="relative hidden flex-wrap items-center gap-1.5 sm:flex" aria-label="Order workflow">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-1.5">
              <span className={i === 3 ? "rounded-full bg-brand-glow px-2.5 py-1.5 text-xs font-semibold text-[#0F1F1A]" : "rounded-full bg-white/[.08] px-2.5 py-1.5 text-xs font-semibold text-[#E3E3E3]"}>{step}</span>
              {i < FLOW.length - 1 && <span className="text-[#4E6B60]" aria-hidden>→</span>}
            </li>
          ))}
        </ol>
      </section>
      <section className="flex flex-1 items-center justify-center px-6 py-10">{children}</section>
    </div>
  );
}
