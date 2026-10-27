"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { apiPost } from "@/lib/api";
import { cx } from "@/components/ui/primitives";

export type AssistantAnswer = {
  supported: boolean;
  answer: string;
  intent: string;
  params: Record<string, string | number>;
  range?: { label: string } | null;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  interpretedBy: "ai" | "rules";
  formattedBy: "ai" | "rules";
  model: string | null;
};

type Turn = { id: number; question: string; answer?: AssistantAnswer; error?: string };

export const SUGGESTIONS = [
  "What jobs did technician Ali complete last week?",
  "Which technician completed the most jobs this week?",
  "How many jobs were completed today?",
  "Which technician might be overloaded this week?",
  "Which jobs are waiting for manager review?",
  "Show flagged jobs this week"
];

const STORAGE_KEY = "sejuksejuk.assistant.history";

export function AssistantChat({ compact = false }: { compact?: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) setTurns(JSON.parse(saved) as Turn[]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-12))); } catch { /* ignore */ }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function ask(text = question) {
    const value = text.trim();
    if (!value || busy) return;
    const id = Date.now();
    setTurns((current) => [...current, { id, question: value }]);
    setQuestion("");
    setBusy(true);
    try {
      const answer = await apiPost<AssistantAnswer>("/api/operations/query", { question: value });
      setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, answer } : turn)));
    } catch (error) {
      setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, error: error instanceof Error ? error.message : "The assistant is unavailable." } : turn)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cx("flex-1 space-y-5 overflow-y-auto", compact ? "p-4" : "py-2")} aria-live="polite">
        {turns.length === 0 && (
          <div className={cx("flex flex-col gap-3", !compact && "pt-6")}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-tint"><Sparkles className="h-[18px] w-[18px] text-brand" aria-hidden /></span>
              <div>
                <p className="text-sm font-semibold text-ink">Ask about your operations</p>
                <p className="text-xs text-ink-muted">Answers come from live service records only.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((item) => (
                <button key={item} onClick={() => ask(item)} className="rounded-full bg-white px-3 py-1.5 text-left text-[12.5px] font-medium text-ink-2 shadow-[0_0_0_1px_#D9D9D9] transition hover:shadow-[0_0_0_1px_#1A1A1A]">
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-3 animate-fade-up">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[14px] leading-snug text-white">{turn.question}</div>
            <div className="flex gap-2.5">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-brand-tint"><Sparkles className="h-[15px] w-[15px] text-brand" aria-hidden /></span>
              <div className="min-w-0 flex-1 space-y-2.5">
                {!turn.answer && !turn.error && (
                  <div className="flex items-center gap-2 pt-1 text-[13px] text-ink-muted">
                    <span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint" style={{ animationDelay: i * 120 + "ms" }} />)}</span>
                    Checking service records…
                  </div>
                )}
                {turn.error && <p className="rounded-lg bg-danger-tint px-3 py-2 text-[13px] text-danger">{turn.error}</p>}
                {turn.answer && <AnswerBlock answer={turn.answer} compact={compact} onAsk={ask} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className={cx(compact ? "border-t border-line p-3" : "pt-3")}>
        <label className="card flex items-center gap-2 py-1.5 pl-4 pr-1.5">
          <span className="sr-only">Ask a question</span>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about jobs, technicians, revenue…" maxLength={300} className="h-9 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint" />
          <button disabled={busy || !question.trim()} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink text-white transition disabled:opacity-40">
            <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </label>
      </form>
    </div>
  );
}

function AnswerBlock({ answer, compact, onAsk }: { answer: AssistantAnswer; compact: boolean; onAsk: (q: string) => void }) {
  const params = Object.entries(answer.params ?? {});
  const orderColumn = answer.columns.includes("Order");
  return (
    <>
      {answer.supported && (
        <div className="flex flex-wrap items-center gap-1.5">
          <code className="rounded-md bg-[#F1F1F1] px-2 py-0.5 font-mono text-[11px] text-ink-2">{answer.intent}</code>
          {params.map(([key, value]) => (
            <code key={key} className="rounded-md bg-[#F1F1F1] px-2 py-0.5 font-mono text-[11px] text-ink-muted">{key}={String(value)}</code>
          ))}
          <span className="text-[11px] font-semibold text-brand-ink">· {answer.rows.length} {answer.rows.length === 1 ? "row" : "rows"}</span>
        </div>
      )}
      <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink">{answer.answer}</p>
      {answer.rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="max-h-72 overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-[#FAFAFA]">
                <tr>{answer.columns.map((col) => <th key={col} className="whitespace-nowrap px-3 py-2 text-[11.5px] font-semibold text-ink-muted">{col}</th>)}</tr>
              </thead>
              <tbody>
                {answer.rows.slice(0, compact ? 8 : 50).map((row, i) => (
                  <tr key={i} className="border-t border-[#F1F1F1]">
                    {answer.columns.map((col) => (
                      <td key={col} className="num whitespace-nowrap px-3 py-2 text-[12.5px] text-ink-2">
                        {col === "Order" && orderColumn ? <Link href={"/manager/reviews/" + row[col]} className="font-semibold text-ink hover:underline">{row[col]}</Link> : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-[11px] text-ink-faint">
        {answer.supported
          ? `Interpreted by ${answer.interpretedBy === "ai" ? "AI" : "rules"} · written by ${answer.formattedBy === "ai" ? "AI" : "rules"} from ${answer.rows.length} records${answer.model ? " · " + answer.model : ""}`
          : "Outside what this assistant can answer"}
      </p>
      {!answer.supported && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, 3).map((item) => (
            <button key={item} onClick={() => onAsk(item)} className="rounded-full bg-white px-2.5 py-1 text-[12px] text-ink-2 shadow-[0_0_0_1px_#D9D9D9] hover:shadow-[0_0_0_1px_#1A1A1A]">{item}</button>
          ))}
        </div>
      )}
    </>
  );
}
