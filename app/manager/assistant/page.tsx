"use client";

import { Sparkles } from "lucide-react";
import { DesktopShell } from "@/components/shell/desktop-shell";
import { AssistantChat } from "@/components/assistant/assistant-chat";

const STEPS = [
  "Your question is matched to one approved query type",
  "Supabase returns only the matching rows",
  "AI writes the answer from those rows only"
];

const SUPPORTED = [
  "Jobs by technician and period",
  "Top technician by jobs or revenue",
  "Jobs completed / revenue for a period",
  "Jobs waiting for review",
  "Unassigned orders",
  "Overloaded technicians",
  "Flagged jobs and extra charges above RM X"
];

export default function AssistantPage() {
  return (
    <DesktopShell roles={["manager", "admin"]} assistant={false}>
      <div className="mx-auto flex max-w-[1120px] flex-wrap gap-6">
        <section className="flex min-h-[calc(100vh-140px)] min-w-0 flex-[999_1_480px] flex-col">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink"><Sparkles className="h-[18px] w-[18px] text-brand-glow" aria-hidden /></span>
            <div>
              <h1 className="text-lg font-bold text-ink">Ops assistant</h1>
              <p className="text-xs text-ink-muted">Answers from live order data · read-only</p>
            </div>
          </div>
          <div className="mx-auto mt-4 flex min-h-0 w-full max-w-[760px] flex-1 flex-col">
            <AssistantChat />
          </div>
        </section>
        <aside className="flex w-full flex-col gap-3 lg:w-[300px]">
          <div className="card space-y-2.5 p-4">
            <h2 className="text-[13px] font-semibold text-ink">How answers are built</h2>
            {STEPS.map((step, i) => (
              <div key={step} className="flex gap-2.5 text-[12.5px] leading-snug text-ink-2">
                <span className="num flex h-5 w-5 flex-none items-center justify-center rounded-md bg-[#F1F1F1] text-[11px] font-bold">{i + 1}</span>{step}
              </div>
            ))}
          </div>
          <div className="card space-y-1.5 p-4">
            <h2 className="text-[13px] font-semibold text-ink">Supported questions</h2>
            <ul className="space-y-1 text-[12.5px] text-ink-2">{SUPPORTED.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <p className="rounded-xl bg-warn-tint px-3.5 py-3 text-xs leading-relaxed text-[#5C3800] shadow-[0_0_0_1px_#F5D9A8]">
            It can&apos;t answer general questions, change records or show customer payment details. When AI is unavailable, rule-based answers are used.
          </p>
        </aside>
      </div>
    </DesktopShell>
  );
}
