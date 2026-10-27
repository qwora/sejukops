"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { MobileShell } from "@/components/shell/mobile-shell";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/primitives";
import { JobStateTag } from "@/components/technician/job-bits";
import { listCompletions, listOrders } from "@/lib/data";
import { useLoad } from "@/lib/use-load";
import { useSession } from "@/lib/session";
import { dayKey, formatDate, formatTime, money } from "@/lib/format";

export default function TechnicianHistoryPage() {
  return (
    <MobileShell>
      <HistoryView />
    </MobileShell>
  );
}

function HistoryView() {
  const session = useSession();
  const me = session.technicianName;
  const { data, error, loading, reload } = useLoad(async () => {
    const [orders, completions] = await Promise.all([listOrders(), listCompletions()]);
    return { orders, completions: completions.filter((c) => c.technicianName === me) };
  }, [me]);

  const groups = new Map<string, NonNullable<typeof data>["completions"]>();
  for (const item of data?.completions ?? []) {
    const key = dayKey(item.completedAt);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const total = (data?.completions ?? []).reduce((sum, c) => sum + c.finalAmount, 0);

  return (
    <div>
      <header className="bg-white px-5 pb-4 pt-6">
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">History</h1>
        <p className="num mt-1 text-[13px] text-ink-muted">{data ? `${data.completions.length} jobs · ${money(total, 0)} total` : "Loading…"}</p>
      </header>
      <div className="flex flex-col gap-4 px-4 pt-4">
        {error && <ErrorBanner message={error} onRetry={() => reload()} />}
        {loading && !data && <><Skeleton className="h-5 w-24" /><Skeleton className="h-36 w-full rounded-2xl" /></>}
        {data && data.completions.length === 0 && (
          <div className="rounded-2xl bg-white"><EmptyState icon={<History className="h-5 w-5" />} title="No completed jobs yet" body="Jobs you mark done show up here, grouped by day." /></div>
        )}
        {[...groups.entries()].map(([key, items]) => (
          <section key={key}>
            <h2 className="mb-2 flex justify-between px-1 text-[13px] font-bold text-ink-muted">
              <span>{formatDate(items[0].completedAt, { weekday: "long", day: "numeric", month: "short" })}</span>
              <span className="num">{money(items.reduce((s, c) => s + c.finalAmount, 0), 0)}</span>
            </h2>
            <div className="rounded-2xl bg-white px-4">
              {items.map((item) => {
                const order = data?.orders.find((o) => o.orderNo === item.orderNo);
                return (
                  <Link key={item.id} href={"/technician/jobs/" + item.orderNo} className="flex min-h-[56px] items-center gap-3 border-b border-line py-3 last:border-0">
                    <span className="num w-[44px] text-[13px] font-bold text-ink-muted">{formatTime(item.completedAt)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{order?.serviceType ?? item.orderNo}</span>
                      <span className="block truncate text-xs text-ink-faint">{item.orderNo} · {order?.customerName}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="num text-[13px] font-bold text-ink">{money(item.finalAmount, 0)}</span>
                      {order && <JobStateTag status={order.status} />}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
