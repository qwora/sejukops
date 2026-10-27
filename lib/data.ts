"use client";

import { supabase } from "@/lib/supabase/client";
import { COMPLETION_SELECT, ORDER_SELECT, toActivity, toCompletion, toNotification, toOrder, toTechnician } from "@/lib/supabase/mappers";
import type { ActivityEntry, AppNotification, ServiceCompletion, ServiceOrder, Technician } from "@/lib/order-types";

/** Read-only data access for screens. All writes go through /api routes. */

export async function listOrders(): Promise<ServiceOrder[]> {
  const { data, error } = await supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toOrder);
}

export async function listTechnicians(): Promise<Technician[]> {
  const { data, error } = await supabase.from("technicians").select("*").eq("active", true).order("name");
  if (error) throw error;
  return (data ?? []).map(toTechnician);
}

export async function listCompletions(since?: Date): Promise<ServiceCompletion[]> {
  let query = supabase.from("service_completions").select(COMPLETION_SELECT).order("completed_at", { ascending: false });
  if (since) query = query.gte("completed_at", since.toISOString());
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toCompletion);
}

export type OrderBundle = {
  order: ServiceOrder;
  completion: ServiceCompletion | null;
  activity: ActivityEntry[];
  notifications: AppNotification[];
  review: { status: string; notes: string; reviewedAt: string } | null;
};

export async function getOrderBundle(orderNo: string): Promise<OrderBundle | null> {
  const { data: row, error } = await supabase.from("orders").select(ORDER_SELECT).eq("order_no", orderNo).maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const [completion, activity, notifications, review] = await Promise.all([
    supabase.from("service_completions").select(COMPLETION_SELECT).eq("order_id", row.id).maybeSingle(),
    supabase.from("activity_logs").select("*, profiles(full_name)").eq("order_id", row.id).order("created_at", { ascending: false }),
    supabase.from("notifications").select("*, orders(order_no)").eq("order_id", row.id).order("created_at", { ascending: false }),
    supabase.from("job_reviews").select("*").eq("order_id", row.id).maybeSingle()
  ]);

  for (const result of [completion, activity, notifications, review]) if (result.error) throw result.error;

  return {
    order: toOrder(row),
    completion: completion.data ? toCompletion(completion.data) : null,
    activity: (activity.data ?? []).map(toActivity),
    notifications: (notifications.data ?? []).map(toNotification),
    review: review.data ? { status: review.data.review_status, notes: review.data.review_notes ?? "", reviewedAt: review.data.reviewed_at } : null
  };
}

export async function listNotifications(limit = 20): Promise<AppNotification[]> {
  const { data, error } = await supabase.from("notifications").select("*, orders(order_no)").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(toNotification);
}

export async function signedEvidenceUrls(paths: string[]) {
  if (paths.length === 0) return {} as Record<string, string>;
  const { data, error } = await supabase.storage.from("service-evidence").createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  return Object.fromEntries((data ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl])) as Record<string, string>;
}

/** Upload evidence before calling the complete route. Returns stored file metadata. */
export async function uploadEvidence(orderNo: string, files: File[]) {
  const uploaded: Array<{ name: string; path: string; type: string }> = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = orderNo + "/" + Date.now() + "-" + safeName;
    const { error } = await supabase.storage.from("service-evidence").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;
    uploaded.push({ name: file.name, path, type: file.type || "application/octet-stream" });
  }
  return uploaded;
}
