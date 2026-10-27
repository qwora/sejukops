"use client";

import { useRef, useState } from "react";
import { FileImage, Sparkles, X } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Button, cx } from "@/components/ui/primitives";

export type ExtractedFields = Partial<{
  customerName: string;
  customerPhone: string;
  address: string;
  serviceType: string;
  branch: string;
  problemDescription: string;
  quotedPrice: string;
  scheduledAt: string;
  adminNotes: string;
}>;

const LABELS: Record<string, string> = {
  customerName: "Name", customerPhone: "Phone", address: "Address", serviceType: "Service", branch: "Branch",
  problemDescription: "Problem", quotedPrice: "Price", scheduledAt: "Date", adminNotes: "Notes"
};

/** Shrink photos before upload so they fit serverless limits and read faster. */
async function toDataUrl(file: File, max = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** AI Document Understanding: photo or pasted text → order fields. */
export function DocumentImport({ onExtract }: { onExtract: (fields: ExtractedFields) => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ found: string[]; confidence: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : "");
    setResult(null);
    setError("");
  }

  async function run() {
    if (!file && !text.trim()) {
      setError("Add a photo or paste the customer's message first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const image = file ? await toDataUrl(file) : undefined;
      const response = await apiPost<{ fields: ExtractedFields; found: string[]; confidence: string }>("/api/ai/extract", { image, text });
      onExtract(response.fields);
      setResult({ found: response.found, confidence: response.confidence });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the document.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl bg-ai-tint px-4 py-3 text-left shadow-[0_0_0_1px_#E2D5FA] transition hover:shadow-[0_0_0_1px_#5E35B1]">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-white"><Sparkles className="h-[18px] w-[18px] text-ai" /></span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ai-ink">Fill from a document</span>
          <span className="block text-xs text-ink-muted">Upload a job sheet, quotation or WhatsApp screenshot, or paste the message. AI fills the form; you check it.</span>
        </span>
        <span className="text-xs font-semibold text-ai">Try it →</span>
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-ai-tint p-4 shadow-[0_0_0_1px_#E2D5FA] animate-fade-up">
      <div className="flex items-center gap-2">
        <Sparkles className="h-[18px] w-[18px] text-ai" />
        <h2 className="text-sm font-semibold text-ai-ink">Fill from a document</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-black/5"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cx("relative flex h-[104px] w-[104px] flex-none flex-col items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-white text-xs font-semibold text-ai", !preview && "border-[1.5px] border-dashed border-[#C7B5EE]")}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Document to read" className="h-full w-full object-cover" />
          ) : (
            <><FileImage className="h-6 w-6" />Add photo</>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" aria-label="Document photo" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Or paste text</span>
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Or paste the customer's WhatsApp message, e.g.\n“Hi, I'm Farah 012-555 1234, 2 aircond in Subang Jaya not cold, can come Thursday 3pm?”"} className="field-area h-[104px] resize-none bg-white" />
        </label>
      </div>
      {error && <p className="text-[13px] text-danger">{error}</p>}
      {result && (
        <p className="text-[13px] text-ai-ink">
          Filled {result.found.length} {result.found.length === 1 ? "field" : "fields"}: {result.found.map((key) => LABELS[key] ?? key).join(", ")} · confidence {result.confidence}. <b>Check every field before saving.</b>
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="primary" loading={busy} onClick={run} icon={<Sparkles className="h-4 w-4" />}>{busy ? "Reading…" : "Extract details"}</Button>
        {(file || text) && <Button type="button" onClick={() => { pick(null); setText(""); }}>Clear</Button>}
      </div>
    </section>
  );
}
