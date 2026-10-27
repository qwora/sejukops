"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { DocumentImport } from "@/components/orders/document-import";
import { DesktopShell, PageHeader } from "@/components/shell/desktop-shell";
import { Avatar, Badge, Button, Card, cx, ErrorBanner } from "@/components/ui/primitives";
import { listOrders, listTechnicians } from "@/lib/data";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { isToday, isoToMyLocalInput, money, myLocalInputToIso } from "@/lib/format";
import { isValidMyPhone } from "@/lib/phone";
import { newJobMessage } from "@/lib/whatsapp";
import { branchOptions, serviceOptions } from "@/lib/order-types";

/** Three hours from now, on the hour, in Malaysia time. */
function defaultSlot() {
  const hour = Math.ceil((Date.now() + 3 * 3600000) / 3600000) * 3600000;
  return isoToMyLocalInput(new Date(hour));
}

export default function NewOrderPage() {
  return (
    <DesktopShell roles={["admin"]}>
      <NewOrderForm />
    </DesktopShell>
  );
}

function NewOrderForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", address: "", problemDescription: "",
    serviceType: serviceOptions[0], branch: branchOptions[1], scheduledAt: defaultSlot(),
    quotedPrice: "", technician: "", adminNotes: ""
  });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data } = useLoad(async () => {
    const [orders, techs] = await Promise.all([listOrders(), listTechnicians()]);
    return { orders, techs };
  });

  const techCards = useMemo(() => {
    if (!data) return [];
    return data.techs
      .map((tech) => {
        const mine = data.orders.filter((o) => o.assignedTechnician === tech.name);
        const open = mine.filter((o) => o.status === "Assigned" || o.status === "In Progress").length;
        const today = mine.filter((o) => isToday(o.scheduledAt)).length;
        const sameBranch = tech.branch === form.branch;
        const load = open >= 4 ? "Overloaded" : open >= 2 ? "Busy" : "Available";
        return { ...tech, open, today, sameBranch, load };
      })
      .sort((a, b) => Number(b.sameBranch) - Number(a.sameBranch) || a.open - b.open);
  }, [data, form.branch]);

  const best = techCards.find((t) => t.load !== "Overloaded");
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const phoneOk = isValidMyPhone(form.customerPhone);
  const price = Number(form.quotedPrice);
  const invalid = {
    customerName: !form.customerName.trim(),
    customerPhone: !phoneOk,
    address: !form.address.trim(),
    quotedPrice: form.quotedPrice === "" || !(price >= 0)
  };
  const hasErrors = Object.values(invalid).some(Boolean);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (hasErrors) {
      setError("Please complete the highlighted fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await apiPost<{ orderNo: string }>("/api/orders", {
        ...form,
        quotedPrice: price,
        scheduledAt: myLocalInputToIso(form.scheduledAt)
      });
      router.push("/admin/orders/" + result.orderNo + "?created=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the order.");
      setSaving(false);
    }
  }

  const fieldClass = (bad: boolean) => cx(touched && bad && "border-danger focus:border-danger focus:ring-danger");
  const preview = form.technician
    ? newJobMessage({
        technicianName: form.technician, orderNo: "ORDER####", serviceType: form.serviceType,
        customerName: form.customerName || "Customer", address: form.address || "Address",
        scheduledAt: myLocalInputToIso(form.scheduledAt), quotedPrice: price || 0
      })
    : "";

  return (
    <form onSubmit={submit} noValidate className="mx-auto flex max-w-[1040px] flex-col gap-4">
      <PageHeader back="/admin/orders" title="Create order" meta={<span className="num rounded-md bg-rail px-2 py-0.5 text-xs font-semibold text-ink-muted">Order no. assigned on save</span>} />
      {error && <ErrorBanner message={error} />}

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          <DocumentImport
            onExtract={(fields) =>
              setForm((current) => {
                const next = { ...current };
                for (const [key, value] of Object.entries(fields)) {
                  if (value && key in next) (next as Record<string, string>)[key] = value;
                }
                return next;
              })
            }
          />
          <Card title="Customer">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="label">Customer name
                <input className={cx("field-input", fieldClass(invalid.customerName))} value={form.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="e.g. Ahmad Faizal" autoComplete="off" />
              </label>
              <label className="label">Phone
                <div className="flex gap-1.5">
                  <span className="flex h-9 items-center rounded-lg border border-line-input bg-canvas px-2.5 text-[13px] text-ink-muted">+60</span>
                  <input className={cx("field-input num", fieldClass(invalid.customerPhone))} inputMode="tel" value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} placeholder="12-345 6789" />
                </div>
                {touched && invalid.customerPhone && <span className="text-xs font-normal text-danger">Enter a Malaysian mobile number</span>}
              </label>
            </div>
            <label className="label">Service address
              <textarea rows={2} className={cx("field-area", fieldClass(invalid.address))} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Unit, street, area, postcode" />
            </label>
          </Card>

          <Card title="Service">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="label">Service type
                <select className="field-input" value={form.serviceType} onChange={(e) => update("serviceType", e.target.value)}>{serviceOptions.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="label">Branch
                <select className="field-input" value={form.branch} onChange={(e) => update("branch", e.target.value)}>{branchOptions.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="label"><span>Preferred slot <span className="hint">· Malaysia time</span></span>
                <input type="datetime-local" className="field-input num" value={form.scheduledAt} onChange={(e) => update("scheduledAt", e.target.value)} />
              </label>
            </div>
            <label className="label">Problem description
              <textarea rows={3} className="field-area" value={form.problemDescription} onChange={(e) => update("problemDescription", e.target.value)} placeholder="e.g. 2 wall units, living room unit dripping water" />
            </label>
          </Card>

          <Card title="Assign technician" action={<span className="hint">Same branch first, then lightest load</span>}>
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Technician">
              <TechOption selected={form.technician === ""} onSelect={() => update("technician", "")} name="" title="Leave unassigned" meta="Assign later from the order page" />
              {techCards.map((tech) => (
                <TechOption
                  key={tech.id}
                  selected={form.technician === tech.name}
                  onSelect={() => update("technician", tech.name)}
                  name={tech.name}
                  title={tech.name}
                  meta={`${tech.branch ?? "—"} · ${tech.open} open · ${tech.today} today`}
                  badge={
                    tech.name === best?.name ? <Badge tone="brand">Best match</Badge>
                    : tech.load === "Overloaded" ? <Badge tone="danger">Overloaded</Badge>
                    : tech.load === "Busy" ? <Badge tone="warn">Busy</Badge>
                    : <Badge tone="blue">Available</Badge>
                  }
                />
              ))}
              {!data && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[62px] animate-pulse rounded-[10px] bg-rail" />)}
            </div>
          </Card>

          <Card title="Admin notes">
            <label className="label"><span className="hint">Shown to the assigned technician</span>
              <textarea rows={2} className="field-area" value={form.adminNotes} onChange={(e) => update("adminNotes", e.target.value)} placeholder="e.g. Call before arrival. Guard house needs IC." />
            </label>
          </Card>
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-20">
          <Card title="Pricing">
            <label className="label">Quoted price
              <div className="flex gap-1.5">
                <span className="flex h-9 items-center rounded-lg border border-line-input bg-canvas px-2.5 text-[13px] text-ink-muted">RM</span>
                <input className={cx("field-input num", fieldClass(invalid.quotedPrice))} inputMode="decimal" type="number" min="0" step="1" value={form.quotedPrice} onChange={(e) => update("quotedPrice", e.target.value)} placeholder="0.00" />
              </div>
            </label>
            <div className="border-t border-line pt-2 text-[13px]">
              <div className="flex justify-between py-1"><span className="text-ink-muted">{form.serviceType}</span><span className="num">{money(price || 0)}</span></div>
              <div className="flex justify-between pt-2 text-sm font-semibold"><span>Quoted total</span><span className="num">{money(price || 0)}</span></div>
              <p className="mt-1 text-xs text-ink-muted">Technician extras are added on top. The quote is never overwritten.</p>
            </div>
          </Card>

          <Card title="Notify technician" action={<MessageCircle className="h-4 w-4 text-[#0B6E4F]" aria-hidden />}>
            {form.technician ? (
              <div className="rounded-2xl bg-whatsapp-bubble/60 p-3 text-[12.5px] leading-relaxed text-[#12301F]">
                <div className="mb-1 text-[11px] font-semibold text-ok">WhatsApp preview → {form.technician}</div>
                <p className="whitespace-pre-line">{preview}</p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">Pick a technician to prepare a WhatsApp job message. You send it from the order page.</p>
            )}
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" size="lg" loading={saving}>{form.technician ? "Create & assign to " + form.technician : "Create order"}</Button>
            <Button type="button" onClick={() => router.push("/admin/orders")}>Cancel</Button>
          </div>
        </aside>
      </div>
    </form>
  );
}

function TechOption({ selected, onSelect, name, title, meta, badge }: { selected: boolean; onSelect: () => void; name: string; title: string; meta: string; badge?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx("flex w-full items-center gap-3 rounded-[10px] border bg-white p-3 text-left transition", selected ? "border-ink bg-[#F7FAFC] shadow-[0_0_0_1px_#2E7BAA]" : "border-[#E3E3E3] hover:border-ink-faint")}
    >
      <Avatar name={name} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-muted">{meta}</span>
      </span>
      {badge}
    </button>
  );
}
