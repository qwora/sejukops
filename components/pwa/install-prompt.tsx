"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { cx } from "@/components/ui/primitives";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "sejuksejuk.install.dismissed";

/** Registers the service worker in production. Mounted once in the root layout. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

/**
 * "Install app" card for technicians.
 * Android / desktop Chrome: real install prompt. iPhone: a short Add to Home Screen hint.
 * Hidden when already installed or dismissed.
 */
export function InstallPrompt({ compact = false }: { compact?: boolean }) {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(DISMISS_KEY) === "1"; } catch { /* ignore */ }
    if (standalone || dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setHidden(true);
    try { window.localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") setHidden(true);
    setEvent(null);
  }

  if (hidden || (!event && !ios)) return null;

  if (compact) {
    return event ? (
      <button onClick={install} className="mb-1 flex h-10 w-full items-center gap-2.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-brand shadow-card">
        <Download className="h-[18px] w-[18px]" />Install Sejuk Ops
      </button>
    ) : null;
  }

  return (
    <div className={cx("flex items-center gap-3 rounded-3xl border border-line bg-white p-3.5 animate-fade-up")}>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-brand-grad text-white">
        {ios ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-snug">
        <p className="font-medium text-ink">Install Sejuk Ops</p>
        <p className="text-ink-muted">{ios ? "Tap Share, then “Add to Home Screen”." : "Open it like an app, full screen."}</p>
      </div>
      {!ios && <button onClick={install} className="h-10 rounded-full bg-brand px-4 text-[13px] font-medium text-white">Install</button>}
      <button onClick={dismiss} aria-label="Dismiss" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-faint hover:bg-rail"><X className="h-4 w-4" /></button>
    </div>
  );
}
