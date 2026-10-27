"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, ReceiptText, Search } from "lucide-react";
import { DesktopShell, PageHeader } from "@/components/shell/desktop-shell";
import { Avatar, Button, cx, EmptyState, ErrorBanner, LinkButton, PageLoading, Stat, StatusPill } from "@/components/ui/primitives";
import { listCompletions, listOrders } from "@/lib/data";
import { useLoad } from "@/lib/use-load";
import { useSession } from "@/lib/session";
import { formatDate, isToday, money, relativeSlot, startOfMyDay, timeAgo } from "@/lib/format";
import { branchOptions, ORDER_STATUSES, technicianOptions, type OrderStatus } from "@/lib/order-types";

const PAGE_SIZE = 12;

export default function AdminOrdersPage() {
  return (
    <DesktopShell roles={["admin", "manager"]}>
      <Suspense fallback={<PageLoading />}>
        <OrdersView />
      </Suspense>
    </DesktopShell>
  );
}

function OrdersView() {
  const params = useSearchParams();
  const session = useSession();
  const { data, error, loading, reload } = useLoad(async () => {
    const [orders, today] = await Promise.all([listOrders(), listCompletions(startOfMyDay())]);
    return { orders, today };
  });

  const [tab, setTab] = useState<"All" | OrderStatus>("All");
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [branch, setBranch] = useState(params.get("branch") ?? "");
  const [tech, setTech] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => { setSearch(params.get("q") ?? ""); setBranch(params.get("branch") ?? ""); }, [params]);
  useEffect(() => setPage(0), [tab, search, branch, tech]);

  const orders = useMemo(() => data?.orders ?? [], [data]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: orders.length };
    for (const status of ORDER_STATUSES) map[status] = orders.filter((o) => o.status === status).length;
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (tab !== "All" && order.status !== tab) return false;
      if (branch && order.branch !== branch) return false;
      if (tech && (tech === "unassigned" ? order.assignedTechnician : order.assignedTechnician !== tech)) return false;
      if (!query) return true;
      return [order.orderNo, order.customerName, order.customerPhone, order.serviceType, order.assignedTechnician, order.branch, order.address].join(" ").toLowerCase().includes(query);
    });
  }, [orders, tab, search, branch, tech]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const unassigned = orders.filter((o) => o.status === "New");
  const oldestNew = unassigned.reduce<string | null>((oldest, o) => (!oldest || o.createdAt < oldest ? o.createdAt : oldest), null);
  const createdToday = orders.filter((o) => isToday(o.createdAt)).length;
  const inField = orders.filter((o) => o.status === "In Progress").length;
  const revenueToday = (data?.today ?? []).reduce((sum, c) => sum + c.finalAmount, 0);

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-4">
      <PageHeader
        title="Orders"
        subtitle={formatDate(new Date().toISOString(), { weekday: "short", day: "numeric", month: "short" }) + (branch ? " · " + branch : " · All branches")}
        actions={session.role === "admin" && <LinkButton variant="primary" href="/admin/orders/new" icon={<Plus className="h-4 w-4" />}>Create order</LinkButton>}
      />

      {error && <ErrorBanner message={"Could not load orders: " + error} onRetry={() => reload()} />}
      {loading && !data && <PageLoading rows={8} />}

      {data && (
        <>
          <div className="card grid grid-cols-2 gap-px overflow-hidden bg-[#F1F1F1] md:grid-cols-4 [&>*]:bg-white">
            <Stat label="Orders created today" value={createdToday} />
            <Stat label="Unassigned" value={unassigned.length} tone={unassigned.length ? "danger" : undefined} note={oldestNew ? "oldest " + timeAgo(oldestNew).replace(" ago", "") : undefined} />
            <Stat label="In the field now" value={inField} note={"of " + technicianOptions.length + " technicians"} />
            <Stat label="Collected today" value={money(revenueToday, 0)} note={(data.today.length) + " jobs done"} />
          </div>

          {unassigned.length > 0 && tab !== "New" && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-warn-tint px-4 py-3 shadow-[0_0_0_1px_#F5D9A8]">
              <AlertTriangle className="h-[18px] w-[18px] flex-none text-warn" aria-hidden />
              <p className="flex-1 text-[13px] text-[#5C3800]"><b>{unassigned.length} {unassigned.length === 1 ? "order is" : "orders are"} waiting for a technician.</b> Assign them so the job reaches the field.</p>
              <Button size="sm" onClick={() => setTab("New")}>Show unassigned</Button>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Status">
                {(["All", ...ORDER_STATUSES] as const).map((status) => (
                  <button
                    key={status}
                    role="tab"
                    aria-selected={tab === status}
                    onClick={() => setTab(status)}
                    className={cx("inline-flex h-[30px] items-center gap-1.5 rounded-lg px-3 text-[13px] transition", tab === status ? "bg-[#E3E3E3] font-semibold text-ink" : "font-medium text-ink-muted hover:bg-[#F1F1F1]")}
                  >
                    {status}
                    <span className={cx("num rounded-md px-1.5 text-[11px] font-semibold", tab === status ? "bg-white text-ink-muted" : "bg-[#F1F1F1] text-ink-muted")}>{counts[status] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
              <label className="flex h-8 min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-line-input px-2.5 focus-within:border-ink">
                <Search className="h-4 w-4 text-ink-faint" aria-hidden />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer, phone, address" aria-label="Search orders" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
              </label>
              <select value={tech} onChange={(e) => setTech(e.target.value)} aria-label="Technician" className="h-8 rounded-lg border border-line-input bg-white px-2 text-[13px] text-ink-2">
                <option value="">All technicians</option>
                <option value="unassigned">Unassigned</option>
                {technicianOptions.map((name) => <option key={name}>{name}</option>)}
              </select>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Branch" className="h-8 rounded-lg border border-line-input bg-white px-2 text-[13px] text-ink-2">
                <option value="">All branches</option>
                {branchOptions.map((name) => <option key={name}>{name}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={<ReceiptText className="h-5 w-5" />} title="No orders match" body="Try another status, branch or search term." action={(search || branch || tech || tab !== "All") && <Button size="sm" onClick={() => { setSearch(""); setBranch(""); setTech(""); setTab("All"); }}>Clear filters</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F7F7F7] text-xs font-medium text-ink-muted">
                      {["Order", "Customer", "Service", "Technician", "Scheduled", "Quote", "Status"].map((head) => (
                        <th key={head} className={cx("whitespace-nowrap border-b border-line px-3 py-2.5 font-medium", head === "Quote" && "text-right", head === "Order" && "pl-4")}>{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((order) => (
                      <tr key={order.id} className="group border-b border-[#F1F1F1] text-[13px] hover:bg-[#FAFAFA]">
                        <td className="whitespace-nowrap py-2.5 pl-4 pr-3">
                          <Link href={"/admin/orders/" + order.orderNo} className="num font-semibold text-ink group-hover:underline">{order.orderNo}</Link>
                          <div className="text-xs text-ink-faint">{timeAgo(order.createdAt)}</div>
                        </td>
                        <td className="max-w-[220px] px-3 py-2.5">
                          <div className="truncate font-medium text-ink-2">{order.customerName}</div>
                          <div className="truncate text-xs text-ink-faint">{order.branch}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{order.serviceType}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <Avatar name={order.assignedTechnician} />
                            <span className={order.assignedTechnician ? "text-ink-2" : "font-medium text-danger"}>{order.assignedTechnician || "Unassigned"}</span>
                          </span>
                        </td>
                        <td className="num whitespace-nowrap px-3 py-2.5 text-ink-muted">
                          {relativeSlot(order.scheduledAt)}
                          {order.rescheduleCount > 0 && <span className="ml-1.5 rounded bg-warn-tint px-1 text-[10.5px] font-semibold text-warn">↻{order.rescheduleCount}</span>}
                        </td>
                        <td className="num whitespace-nowrap px-3 py-2.5 text-right font-medium text-ink-2">{money(order.quotedPrice)}</td>
                        <td className="px-3 py-2.5"><StatusPill status={order.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-xs text-ink-muted">
                <span className="num">Showing {page * PAGE_SIZE + 1}–{Math.min(filtered.length, (page + 1) * PAGE_SIZE)} of {filtered.length}</span>
                <div className="flex gap-1">
                  <Button size="sm" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button size="sm" aria-label="Next page" disabled={(page + 1) * PAGE_SIZE >= filtered.length} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
