import { supabase } from "@/lib/supabase/client";
import { seedOrders } from "@/lib/demo-orders";
import { createOrderNumber } from "@/lib/demo-orders";
import type { ServiceCompletion } from "@/lib/service-completion";
import type { OrderStatus, ServiceOrder } from "@/lib/order-types";

type DbOrder = {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  problem_description: string;
  service_type: string;
  quoted_price: number;
  assigned_technician_id: string | null;
  branch: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

type DbTechnician = {
  id: string;
  name: string;
  phone: string | null;
  branch: string | null;
  active: boolean;
};

const statusToDb: Record<OrderStatus, string> = {
  New: "new",
  Assigned: "assigned",
  "In Progress": "in_progress",
  "Job Done": "job_done",
  Reviewed: "reviewed",
  Closed: "closed"
};

const statusFromDb: Record<string, OrderStatus> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  job_done: "Job Done",
  reviewed: "Reviewed",
  closed: "Closed"
};

function toServiceOrder(row: DbOrder, technician?: DbTechnician): ServiceOrder {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    address: row.address,
    problemDescription: row.problem_description ?? "",
    serviceType: row.service_type,
    quotedPrice: Number(row.quoted_price),
    assignedTechnician: technician?.name ?? "",
    branch: row.branch,
    status: statusFromDb[row.status] ?? "New",
    adminNotes: row.admin_notes ?? "",
    createdAt: row.created_at
  };
}

async function getTechnicianRows() {
  const { data, error } = await supabase
    .from("technicians")
    .select("id,name,phone,branch,active")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return (data ?? []) as DbTechnician[];
}

export async function ensureDemoData() {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  if ((count ?? 0) > 0) return;

  const technicians = await getTechnicianRows();
  const technicianByName = new Map(technicians.map((item) => [item.name, item.id]));

  const payload = seedOrders.map((order) => ({
    order_no: order.orderNo,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    address: order.address,
    problem_description: order.problemDescription,
    service_type: order.serviceType,
    quoted_price: order.quotedPrice,
    assigned_technician_id: technicianByName.get(order.assignedTechnician) ?? null,
    branch: order.branch,
    status: statusToDb[order.status],
    admin_notes: order.adminNotes
  }));

  const { error: insertError } = await supabase.from("orders").insert(payload);
  if (insertError) throw insertError;
}

export async function listOrders(): Promise<ServiceOrder[]> {
  const [{ data: orderRows, error: ordersError }, technicians] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    getTechnicianRows()
  ]);

  if (ordersError) throw ordersError;

  const technicianById = new Map(technicians.map((item) => [item.id, item]));
  return ((orderRows ?? []) as DbOrder[]).map((row) =>
    toServiceOrder(row, row.assigned_technician_id ? technicianById.get(row.assigned_technician_id) : undefined)
  );
}

export async function getOrderByNumber(orderNo: string) {
  const [{ data: orderRow, error: orderError }, technicians] = await Promise.all([
    supabase.from("orders").select("*").eq("order_no", orderNo).single(),
    getTechnicianRows()
  ]);

  if (orderError) throw orderError;

  const row = orderRow as DbOrder;
  const technician = row.assigned_technician_id
    ? technicians.find((item) => item.id === row.assigned_technician_id)
    : undefined;

  return { order: toServiceOrder(row, technician), dbId: row.id, technicianId: row.assigned_technician_id };
}

export async function createDbOrder(input: {
  customerName: string;
  customerPhone: string;
  address: string;
  problemDescription: string;
  serviceType: string;
  quotedPrice: number;
  assignedTechnician: string;
  branch: string;
  adminNotes: string;
}) {
  const [orders, technicians] = await Promise.all([listOrders(), getTechnicianRows()]);
  const technician = technicians.find((item) => item.name === input.assignedTechnician);
  const orderNo = createOrderNumber(orders);

  const { error } = await supabase.from("orders").insert({
    order_no: orderNo,
    customer_name: input.customerName,
    customer_phone: input.customerPhone.replace(/[^0-9]/g, ""),
    address: input.address,
    problem_description: input.problemDescription,
    service_type: input.serviceType,
    quoted_price: input.quotedPrice,
    assigned_technician_id: technician?.id ?? null,
    branch: input.branch,
    status: input.assignedTechnician ? "assigned" : "new",
    admin_notes: input.adminNotes
  });

  if (error) throw error;
  return orderNo;
}

export async function saveCompletionToDb(input: {
  orderNo: string;
  technicianName: string;
  workDone: string;
  extraCharges: number;
  finalAmount: number;
  remarks: string;
  paymentAmount: number;
  paymentMethod: string;
}) {
  const [{ data: order, error: orderError }, technicians] = await Promise.all([
    supabase.from("orders").select("id").eq("order_no", input.orderNo).single(),
    getTechnicianRows()
  ]);

  if (orderError) throw orderError;

  const technician = technicians.find((item) => item.name === input.technicianName);
  const { error: completionError } = await supabase.from("service_completions").upsert({
    order_id: order.id,
    technician_id: technician?.id ?? null,
    work_done: input.workDone,
    extra_charges: input.extraCharges,
    final_amount: input.finalAmount,
    remarks: input.remarks,
    payment_amount: input.paymentAmount,
    payment_method: input.paymentMethod,
    completed_at: new Date().toISOString()
  }, { onConflict: "order_id" });

  if (completionError) throw completionError;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "job_done" })
    .eq("id", order.id);

  if (updateError) throw updateError;
}

export async function listDbCompletions(): Promise<ServiceCompletion[]> {
  const [{ data: rows, error }, technicians] = await Promise.all([
    supabase.from("service_completions").select("*, orders(order_no)"),
    getTechnicianRows()
  ]);

  if (error) throw error;

  const technicianById = new Map(technicians.map((item) => [item.id, item]));
  return (rows ?? []).map((row) => ({
    id: row.id,
    orderNo: row.orders?.order_no ?? "",
    technicianName: technicianById.get(row.technician_id)?.name ?? "Technician",
    workDone: row.work_done ?? "",
    extraCharges: Number(row.extra_charges ?? 0),
    finalAmount: Number(row.final_amount ?? 0),
    remarks: row.remarks ?? "",
    paymentAmount: Number(row.payment_amount ?? 0),
    paymentMethod: row.payment_method ?? "Not recorded",
    fileNames: [],
    completedAt: row.completed_at ?? row.created_at
  }));
}

export async function reviewDbOrder(orderNo: string, status: "reviewed" | "in_progress") {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("order_no", orderNo)
    .single();

  if (orderError) throw orderError;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", order.id);

  if (updateError) throw updateError;

  const { error: reviewError } = await supabase.from("job_reviews").insert({
    order_id: order.id,
    review_status: status === "reviewed" ? "approved" : "returned",
    review_notes: status === "reviewed" ? "Approved in manager queue." : "Returned for technician follow-up.",
    reviewed_at: new Date().toISOString()
  });

  if (reviewError) throw reviewError;
}
