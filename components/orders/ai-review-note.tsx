"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiPost } from "@/lib/api";
import { cx, Skeleton } from "@/components/ui/primitives";

type Review = { recommendation: "approve" | "check"; summary: string; source: "ai" | "rules"; model?: string };

/** AI Workflow Supervisor note, generated from this job's record, rule flags and comparable jobs. */
export function AiReviewNote({ orderNo }: { orderNo: string }) {
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiPost<Review>(`/api/orders/${orderNo}/ai-review`)
      .then((data) => { if (active) setReview(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "AI review unavailable."); });
    return () => { active = false; };
  }, [orderNo]);

  if (error) return <p className="text-xs text-ink-muted">AI review unavailable: {error}</p>;
  if (!review) {
    return (
      <div className="space-y-2 rounded-[10px] bg-white p-3" aria-busy="true" aria-label="AI reviewing this job">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    );
  }
  const approve = review.recommendation === "approve";
  return (
    <div className="rounded-[10px] bg-white p-3 shadow-[0_0_0_1px_#EDE4FB] animate-fade-up">
      <div className="mb-1.5 flex items-center gap-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-ai" aria-hidden />
        <span className={cx("rounded-md px-1.5 py-0.5 text-[11px] font-bold", approve ? "bg-st-done-bg text-st-done-fg" : "bg-st-prog-bg text-st-prog-fg")}>{approve ? "SUGGEST APPROVE" : "CHECK BEFORE APPROVING"}</span>
        <span className="ml-auto text-[11px] text-ink-faint">{review.source === "ai" ? "AI supervisor" + (review.model ? " · " + review.model : "") : "Rule-based (AI unavailable)"}</span>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-2">{review.summary}</p>
    </div>
  );
}
