"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Maximize2, Sparkles, X } from "lucide-react";
import { AssistantChat } from "@/components/assistant/assistant-chat";

/** Sidekick-style launcher: bottom-right button → right-side panel (full screen on mobile). */
export function OperationsAssistant() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const esc = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  if (pathname.startsWith("/manager/assistant")) return null;

  return (
    <>
      {!open && (
        <button
          aria-label="Open operations assistant"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,.25)] transition hover:-translate-y-0.5"
        >
          <Sparkles className="h-4 w-4 text-brand-glow" aria-hidden />
          Ask Ops
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)}>
          <aside
            role="dialog"
            aria-label="Operations assistant"
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-0 flex flex-col bg-canvas shadow-2xl animate-fade-up sm:inset-auto sm:bottom-4 sm:right-4 sm:top-[72px] sm:w-[420px] sm:rounded-2xl sm:ring-1 sm:ring-black/5"
          >
            <header className="flex items-center gap-2.5 border-b border-line bg-white px-4 py-3 sm:rounded-t-2xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-ink"><Sparkles className="h-4 w-4 text-brand-glow" aria-hidden /></span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">Ops assistant</p>
                <p className="text-[11.5px] text-ink-muted">Read-only · answers from controlled queries</p>
              </div>
              <Link href="/manager/assistant" aria-label="Open full page" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-black/5"><Maximize2 className="h-4 w-4" /></Link>
              <button aria-label="Close" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-black/5"><X className="h-4 w-4" /></button>
            </header>
            <div className="min-h-0 flex-1"><AssistantChat compact /></div>
          </aside>
        </div>
      )}
    </>
  );
}
