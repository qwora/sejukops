import Link from "next/link";
import { ArrowRight, ClipboardList, Sparkles, Wrench } from "lucide-react";
import { BrandMark } from "@/components/shell/brand";

const FEATURES = [
  { icon: <ClipboardList className="h-5 w-5" />, title: "Admin portal", text: "Create service orders, assign the right technician and track every status in one table." },
  { icon: <Wrench className="h-5 w-5" />, title: "Technician app", text: "A phone-first job flow: start, record work, add charges and photos, mark done in under a minute." },
  { icon: <Sparkles className="h-5 w-5" />, title: "Manager + AI", text: "Review completed jobs, see team performance and ask operational questions in plain English." }
];

const FLOW = ["New", "Assigned", "In progress", "Job done", "Reviewed", "Closed"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0F1F1A] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="text-[16px] font-bold">Sejuk Ops</span>
        </div>
        <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Sign in</Link>
      </nav>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-20 pt-14 md:pt-24">
        <div className="pointer-events-none absolute -right-48 -top-10 h-[620px] w-[620px] rounded-full border border-brand-glow/15" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-24 h-[420px] w-[420px] rounded-full border border-brand-glow/20" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-glow">Sejuk Sejuk Service Sdn Bhd</p>
        <h1 className="mt-5 max-w-3xl text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-7xl">Every aircond job, from booking to review.</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#A9C2B8]">The internal operations system for 5 branches and 40+ technician teams. Order → Assignment → Service completion → Review.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-brand-glow px-5 py-3.5 text-sm font-bold text-[#0F1F1A] hover:bg-white">
            Open workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ol className="mt-14 flex flex-wrap items-center gap-1.5" aria-label="Workflow">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-1.5">
              <span className="rounded-full bg-white/[.08] px-3 py-1.5 text-xs font-semibold text-[#E3E3E3]">{step}</span>
              {i < FLOW.length - 1 && <span className="text-[#4E6B60]" aria-hidden>→</span>}
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-3 md:grid-cols-3">
          {FEATURES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">{item.icon}</span>
              <h2 className="mt-8 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
