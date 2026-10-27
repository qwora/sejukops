"use client";

import { useState } from "react";

type QueryResponse = {
  answer: string;
  supported: boolean;
  queryType: string;
  data?: unknown;
};

const suggestions = [
  "How many jobs were completed today?",
  "Which technician completed the most jobs this week?",
  "Which jobs are waiting for manager review?"
];

export function OperationsAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(value = question) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setQuestion(trimmed);
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/operations/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: trimmed }) });
      const result = await response.json() as QueryResponse;
      setAnswer(result.answer || "No answer was returned.");
    } catch {
      setAnswer("The operations assistant is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button aria-label="Open operations assistant" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-xl text-white shadow-lg hover:bg-slate-800">✦</button>
      {open && <div className="fixed inset-0 z-50 bg-ink/20" onClick={() => setOpen(false)}>
        <aside role="dialog" aria-label="Operations assistant" onClick={(event) => event.stopPropagation()} className="absolute bottom-0 right-0 flex h-[min(680px,100vh)] w-full flex-col bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:h-[min(680px,calc(100vh-40px))] sm:w-[420px] sm:rounded-3xl">
          <header className="flex items-start justify-between border-b border-slate-200 p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sea">Sidekick</p><h2 className="mt-1 text-lg font-semibold text-ink">Operations assistant</h2><p className="mt-1 text-xs text-slate-500">Answers use controlled service records.</p></div><button aria-label="Close operations assistant" onClick={() => setOpen(false)} className="text-2xl leading-none text-slate-400">×</button></header>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {!answer && !loading && <><p className="text-sm text-slate-600">Ask about jobs, technicians or the review queue.</p><div className="space-y-2">{suggestions.map((item) => <button key={item} onClick={() => ask(item)} className="block w-full rounded-xl border border-slate-200 px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">{item}</button>)}</div></>}
            {loading && <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Checking service records...</div>}
            {answer && <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">{answer}</div>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); ask(); }} className="border-t border-slate-200 p-4"><div className="flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask an operations question..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sea" /><button disabled={loading} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Ask</button></div></form>
        </aside>
      </div>}
    </>
  );
}
