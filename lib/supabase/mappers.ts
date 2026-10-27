import { statusFromDb } from "@/lib/workflow";
import type { ActivityEntry, AppNotification, ServiceCompletion, ServiceOrder, Technician } from "@/lib/order-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const ORDER_SELECT = "*, technicians(id,name)";
export const COMPLETION_SELECT = "*, orders(order_no), technicians(name), service_files(file_name,file_path,file_type)";

export function toOrder(row: any): ServiceOrder {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    address: row.address,
    problemDescription: row.problem_description ?? "",
    serviceType: row.service_type,
    quotedPrice: Number(row.quoted_price),
    assignedTechnician: row.technicians?.name ?? "",
    technicianId: row.assigned_technician_id ?? null,
    branch: row.branch,
    status: statusFromDb[row.status] ?? "New",
    adminNotes: (row.admin_notes ?? "").replace(/^\[demo\]\s*/, ""),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    scheduledAt: row.scheduled_at ?? null,
    rescheduleCount: Number(row.reschedule_count ?? 0)
  };
}

export function toTechnician(row: any): Technician {
  return { id: row.id, name: row.name, phone: row.phone ?? null, branch: row.branch ?? null, profileId: row.profile_id ?? null };
}

export function toCompletion(row: any): ServiceCompletion {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNo: row.orders?.order_no ?? "",
    technicianName: row.technicians?.name ?? "Technician",
    workDone: row.work_done ?? "",
    extraCharges: Number(row.extra_charges ?? 0),
    extraItems: Array.isArray(row.extra_items) ? row.extra_items.map((item: any) => ({ label: String(item.label), amount: Number(item.amount) })) : [],
    finalAmount: Number(row.final_amount ?? 0),
    remarks: row.remarks ?? "",
    paymentAmount: Number(row.payment_amount ?? 0),
    paymentMethod: row.payment_method ?? "Not recorded",
    files: (row.service_files ?? []).map((file: any) => ({ name: file.file_name, path: file.file_path, type: file.file_type ?? "" })),
    completedAt: row.completed_at ?? row.created_at
  };
}

export function toActivity(row: any): ActivityEntry {
  return {
    id: row.id,
    action: row.action,
    previousStatus: row.previous_status ? statusFromDb[row.previous_status] ?? null : null,
    newStatus: row.new_status ? statusFromDb[row.new_status] ?? null : null,
    actor: row.metadata?.actor ?? row.profiles?.full_name ?? "System",
    note: row.metadata?.note ?? "",
    createdAt: row.created_at
  };
}

export function toNotification(row: any): AppNotification {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNo: row.orders?.order_no ?? "",
    channel: row.channel,
    audience: row.audience,
    event: row.event,
    recipient: row.recipient,
    message: row.message,
    link: row.link,
    status: row.status,
    createdAt: row.created_at
  };
}
