import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Orders in one place",
    text: "Create service orders, assign technicians and follow every job from intake to closure."
  },
  {
    number: "02",
    title: "Built for the field",
    text: "Give technicians a focused mobile workflow for service notes, charges and evidence."
  },
  {
    number: "03",
    title: "Operational clarity",
    text: "Help managers review completed work and understand team performance."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#10233f] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff7eb] font-bold text-[#10233f]">S</span>
          <span className="font-semibold tracking-tight">Sejuk Sejuk</span>
        </div>
        <Link className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium hover:bg-white/10" href="/login">
          Sign in
        </Link>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20">
        <div className="max-w-3xl">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-[#a8c4ff]">Service operations, simplified</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] md:text-7xl">
            Keep every service job moving.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
            A connected workspace for air-conditioning service teams to manage orders, field work and operational review.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link className="rounded-full bg-[#dff7eb] px-6 py-3.5 text-sm font-semibold text-[#10233f] hover:bg-white" href="/login">
              Open workspace
            </Link>
            <a className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold hover:bg-white/10" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>

        <div id="how-it-works" className="mt-28 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.number} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
              <p className="text-sm font-semibold text-[#a8c4ff]">{feature.number}</p>
              <h2 className="mt-12 text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-white/55">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
