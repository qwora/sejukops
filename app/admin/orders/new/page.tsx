import { PortalShell } from "@/components/portal-shell";
import { NewOrderForm } from "./new-order-form";

export default function NewOrderPage() {
  return (
    <PortalShell role="Admin" active="Orders">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
        <p className="text-sm text-slate-500">Admin workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Create order</h1>
        <p className="mt-2 text-sm text-slate-500">Add the customer request, quote and assignment details.</p>
      </header>
      <main className="max-w-4xl px-6 py-8 md:px-10">
        <NewOrderForm />
      </main>
    </PortalShell>
  );
}
