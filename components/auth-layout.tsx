import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shell/brand";

/** Sign-in / sign-up frame: brand gradient panel beside the form. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <section className="relative flex min-h-[300px] flex-col overflow-hidden bg-brand-sky px-6 py-8 text-white sm:px-10 lg:w-1/2 lg:px-14 lg:py-12">
        <span className="pointer-events-none absolute -bottom-[380px] -right-[380px] h-[760px] w-[760px] rounded-full border-[64px] border-white/[.12]" aria-hidden />
        <span className="pointer-events-none absolute -bottom-[250px] -right-[250px] h-[500px] w-[500px] rounded-full border-[64px] border-white/20" aria-hidden />
        <Link href="/" className="relative flex items-center gap-3 text-navy">
          <BrandMark size={30} className="text-navy" />
          <span className="text-[19px] font-light">Sejuk <span className="font-medium">Ops</span></span>
        </Link>
        <div className="relative mt-auto flex max-w-[480px] flex-col gap-4 pt-10">
          <h1 className="text-[clamp(36px,4.4vw,60px)] font-extralight leading-[1.02] tracking-[-0.04em]">Every aircond job, from booking to review.</h1>
          <p className="text-base font-light text-[#D6E6F0]">5 branches · 40+ technician teams · one workflow</p>
        </div>
      </section>
      <section className="flex flex-1 items-center justify-center px-6 py-10">{children}</section>
    </div>
  );
}
