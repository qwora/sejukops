import { PortalShell } from "@/components/portal-shell";
import { OrderDetail } from "./order-detail";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PortalShell role="Admin" active="Orders">
      <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
        <p className="text-sm text-slate-500">Order detail</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{id}</h1>
      </header>
      <main className="px-6 py-8 md:px-10">
        <OrderDetail orderNo={id} />
      </main>
    </PortalShell>
  );
}
