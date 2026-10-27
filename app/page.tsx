import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLockup, BrandMark } from "@/components/shell/brand";

const STAGES = [
  { n: "01", title: "New", text: "Admin logs the request" },
  { n: "02", title: "Assigned", text: "Right technician, WhatsApp ready" },
  { n: "03", title: "In progress", text: "Accepted on site" },
  { n: "04", title: "Job done", text: "Photos, charges, customer notified", highlight: true },
  { n: "05", title: "Reviewed", text: "Manager approves with AI check" },
  { n: "06", title: "Closed", text: "Counted in performance" }
];

const ROLES = [
  {
    eyebrow: "Admin · desktop",
    title: "Orders at a glance",
    text: "Live stats, status tabs, a smart technician picker and AI that fills the form from a WhatsApp message or job-sheet photo.",
    foot: "Create · assign · reschedule"
  },
  {
    eyebrow: "Technician · phone",
    title: "Five taps to job done",
    text: "One big action at the bottom, quick chips, photos, extra charges, payment and receipt. The total updates as you go. Installs like an app.",
    foot: "Accept · complete · notify",
    featured: true
  },
  {
    eyebrow: "Manager · desktop",
    title: "Review with a second pair of eyes",
    text: "Supervisor flags, evidence previews and a performance view that spots overloaded technicians before they burn out.",
    foot: "Approve · return · close"
  }
];

function Eyebrow({ children, className = "text-brand-glow" }: { children: ReactNode; className?: string }) {
  return <p className={"eyebrow " + className}>{children}</p>;
}

/** Airflow arcs taken from the logo mark. Decorative only. */
function Arcs({ className = "" }: { className?: string }) {
  return (
    <div className={"pointer-events-none absolute " + className} aria-hidden>
      <span className="absolute -bottom-[320px] -right-[320px] h-[640px] w-[640px] rounded-full border-[56px] border-white/[.16]" />
      <span className="absolute -bottom-[210px] -right-[210px] h-[420px] w-[420px] rounded-full border-[56px] border-white/25" />
      <span className="absolute -bottom-[100px] -right-[100px] h-[200px] w-[200px] rounded-full bg-white/35" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-navy-deep font-sans text-[#F2F5F7]">
      <header className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
        <nav aria-label="Main" className="flex flex-wrap items-center gap-4 rounded-full border border-navy-line bg-navy-card/70 py-2.5 pl-5 pr-2.5 backdrop-blur">
          <Link href="/" aria-label="Sejuk Ops home"><BrandLockup size={22} /></Link>
          <div className="ml-auto hidden gap-6 text-sm font-light text-[#A8C0CE] sm:flex">
            <a href="#workflow" className="hover:text-white">Workflow</a>
            <a href="#roles" className="hover:text-white">Roles</a>
            <a href="#ai" className="hover:text-white">AI</a>
          </div>
          <Link href="/login" className="ml-auto inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover sm:ml-0">
            Open workspace
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-4 pb-24 pt-16 sm:px-6 lg:pt-20">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-7">
          <Eyebrow>Sejuk Sejuk Service Sdn Bhd</Eyebrow>
          <h1 className="text-[clamp(44px,7vw,92px)] font-extralight leading-[0.98] tracking-[-0.04em]">Every aircond job, from booking to review.</h1>
          <p className="max-w-[520px] text-lg font-light leading-relaxed text-[#A8C0CE]">
            One operations system for 5 branches and 40+ technician teams. Admins assign, technicians complete on the go, managers review, and the numbers update themselves.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex h-[52px] items-center rounded-full bg-brand px-7 text-[15px] font-medium text-white hover:bg-brand-hover">Open workspace</Link>
            <a href="#workflow" className="inline-flex h-[52px] items-center rounded-full border border-[#A8C0CE] px-7 text-[15px] font-light hover:border-white">See how it works</a>
          </div>
        </div>

        <div
          className="relative h-[460px] min-w-0 flex-[1_1_420px] overflow-hidden rounded-[35px] bg-brand-sky sm:h-[540px]"
          role="img"
          aria-label="Sejuk Sejuk mark with airflow arcs and live job cards"
        >
          <Arcs className="inset-0" />
          <BrandMark size={112} className="absolute left-10 top-10 text-white" />
          <div className="absolute bottom-[150px] left-8 flex w-[250px] flex-col gap-1.5 rounded-3xl border border-white/20 bg-navy-deep/70 px-[18px] py-4 backdrop-blur-md">
            <span className="eyebrow text-[#6FE0B2]">Job done · 13:46</span>
            <span className="text-[15px] font-medium">ORDER1267 · Aircond cleaning</span>
            <span className="text-[13px] font-light text-[#A8C0CE]">Ali · RM 240.00 · 1 photo</span>
          </div>
          <div className="absolute bottom-10 left-[min(150px,20%)] flex w-[270px] flex-col gap-1.5 rounded-3xl bg-[#F2F5F7]/90 px-[18px] py-4 text-navy">
            <span className="eyebrow text-brand">Ops assistant</span>
            <span className="text-sm leading-snug">Bala completed 7 jobs this week, 1.9× the team average.</span>
          </div>
        </div>
      </section>

      <section className="bg-brand-band">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 py-11 sm:px-6 md:grid-cols-4">
          {[
            ["5", "branches nationwide", "text-navy", "text-navy"],
            ["40+", "technician teams", "text-navy", "text-navy"],
            ["6", "tracked job stages", "text-white", "text-[#E6F1F8]"],
            ["1", "workflow, end to end", "text-white", "text-[#E6F1F8]"]
          ].map(([value, label, valueClass, labelClass]) => (
            <div key={label}>
              <p className={"text-[56px] font-extralight leading-none tracking-tight " + valueClass}>{value}</p>
              <p className={"mt-2 text-sm " + labelClass}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto flex max-w-[1200px] scroll-mt-8 flex-col gap-10 px-4 pb-16 pt-28 sm:px-6">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <Eyebrow>Workflow</Eyebrow>
          <h2 className="text-[clamp(34px,4.5vw,56px)] font-extralight leading-[1.08] tracking-[-0.03em]">Six stages. Every handover logged.</h2>
        </div>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          {STAGES.map((stage) => (
            <li
              key={stage.n}
              className={
                "flex flex-col gap-2.5 rounded-[35px] border p-6 " +
                (stage.highlight ? "border-brand bg-brand" : "border-navy-line bg-navy-card")
              }
            >
              <span className={"text-[13px] " + (stage.highlight ? "text-[#E6F1F8]" : "text-brand-glow")}>{stage.n}</span>
              <span className="text-xl font-light">{stage.title}</span>
              <span className={"text-[13px] font-light " + (stage.highlight ? "text-[#E6F1F8]" : "text-[#A8C0CE]")}>{stage.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="roles" className="mx-auto flex max-w-[1200px] scroll-mt-8 flex-col gap-10 px-4 py-16 sm:px-6">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <Eyebrow>Built for each role</Eyebrow>
          <h2 className="text-[clamp(34px,4.5vw,56px)] font-extralight leading-[1.08] tracking-[-0.03em]">The office gets detail. The field gets speed.</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
          {ROLES.map((role) => (
            <article
              key={role.title}
              className={
                "flex min-h-[300px] flex-col gap-4 rounded-[35px] border border-navy-line p-8 " +
                (role.featured ? "bg-[linear-gradient(170deg,#0E3E5A,#032434)]" : "bg-navy-card")
              }
            >
              <Eyebrow className="text-[#A8C0CE]">{role.eyebrow}</Eyebrow>
              <h3 className="text-[28px] font-light tracking-tight">{role.title}</h3>
              <p className="text-[15px] font-light leading-relaxed text-[#A8C0CE]">{role.text}</p>
              <p className="mt-auto text-[13px] text-brand-glow">{role.foot}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ai" className="mx-auto max-w-[1200px] scroll-mt-8 px-4 pb-28 pt-16 sm:px-6">
        <div className="flex flex-wrap items-center gap-12 rounded-[35px] border border-navy-line bg-navy-card p-[clamp(28px,5vw,64px)]">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
            <Eyebrow>Ops assistant</Eyebrow>
            <h2 className="text-[clamp(30px,4vw,48px)] font-extralight leading-[1.1] tracking-[-0.03em]">Ask in plain words. Answers come only from your records.</h2>
            <p className="text-[15px] font-light leading-relaxed text-[#A8C0CE]">
              The AI picks an approved question type, a filtered query fetches the rows, and the answer is written from those rows only. English or Malay.
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-3">
            <p className="ml-auto max-w-[85%] rounded-[20px_20px_6px_20px] bg-brand px-4 py-3 text-[15px]">What jobs did technician Ali complete last week?</p>
            <div className="rounded-[6px_20px_20px_20px] border border-navy-line bg-navy-deep px-5 py-[18px] text-[15px] font-light leading-relaxed">
              Ali completed 4 jobs last week, totalling RM 990.00:
              <span className="block text-[#A8C0CE]">
                ORDER1241 – Aircond cleaning
                <br />ORDER1244 – Preventive maintenance
                <br />ORDER1247 – Gas refill
                <br />ORDER1252 – Aircond cleaning
              </span>
              <span className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-navy-line px-2.5 py-0.5 text-[11px] text-brand-glow">jobs_by_technician</span>
                <span className="rounded-full border border-navy-line px-2.5 py-0.5 text-[11px] text-[#A8C0CE]">4 rows</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-navy-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4 px-4 py-8 text-[13px] font-light text-[#A8C0CE] sm:px-6">
          <BrandMark size={20} />
          <span>Sejuk Sejuk Service Sdn Bhd · Internal operations</span>
          <Link href="/login" className="ml-auto border-b border-[#A8C0CE] text-[#F2F5F7]">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
