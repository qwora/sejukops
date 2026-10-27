import { serverClient } from "./db";
import type { Actor } from "./actor";
import { calculateFinalAmount, checkTransition, MAX_EVIDENCE_FILES, statusFromDb, statusToDb, WORKFLOW, type WorkflowAction } from "@/lib/workflow";
import { isValidMyPhone, normalizeMyPhone } from "@/lib/phone";
import { jobDoneMessage, newJobMessage, waLink } from "@/lib/whatsapp";
import { branchOptions, serviceOptions, type ExtraItem, type OrderStatus } from "@/lib/order-types";

export class WorkflowError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type Db = ReturnType<typeof serverClient>;

async function loadOrder(db: Db, orderNo: string) {
  const { data, error } = await db.from("orders").select("*, technicians(id,name,phone)").eq("order_no", orderNo).maybeSingle();
  if (error) throw error;
  if (!data) throw new WorkflowError("Order " + orderNo + " was not found.", 404);
  return data as {
    id: string; order_no: string; status: string; customer_name: string; customer_phone: string; address: string;
    service_type: string; quoted_price: number; scheduled_at: string | null; reschedule_count: number;
    technicians: { id: string; name: string; phone: string | null } | null;
  };
}

async function logActivity(db: Db, actor: Actor, orderId: string, action: string, prev: OrderStatus | null, next: OrderStatus | null, note = "", extra: Record<string, unknown> = {}) {
  const { error } = await db.from("activity_logs").insert({
    order_id: orderId,
    actor_id: actor.profileId,
    action,
    previous_status: prev ? statusToDb[prev] : null,
    new_status: next ? statusToDb[next] : null,
    metadata: { actor: actor.name, role: actor.role, mode: actor.mode, note, ...extra }
  });
  if (error) throw error;
}

async function notify(db: Db, input: { orderId: string; channel: "whatsapp" | "internal"; audience: string; event: string; recipient?: string | null; message: string; link?: string | null }) {
  const { error } = await db.from("notifications").insert({
    order_id: input.orderId,
    channel: input.channel,
    audience: input.audience,
    event: input.event,
    recipient: input.recipient ?? null,
    message: input.message,
    link: input.link ?? null
  });
  if (error) throw error;
}

function text(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function createOrder(actor: Actor, body: Record<string, unknown>) {
  if (actor.role !== "admin") throw new WorkflowError("Only Admin can create orders.", 403);
  const db = serverClient(actor.accessToken);

  const input = {
    customerName: text(body.customerName, 120),
    customerPhone: text(body.customerPhone, 30),
    address: text(body.address, 400),
    problemDescription: text(body.problemDescription),
    serviceType: text(body.serviceType, 80),
    branch: text(body.branch, 80),
    adminNotes: text(body.adminNotes),
    technician: text(body.technician, 80),
    scheduledAt: text(body.scheduledAt, 40),
    quotedPrice: Number(body.quotedPrice)
  };

  const missing = [
    !input.customerName && "customer name",
    !input.customerPhone && "phone",
    !input.address && "address",
    !(input.quotedPrice >= 0) && "quoted price"
  ].filter(Boolean);
  if (missing.length) throw new WorkflowError("Please fill in: " + missing.join(", ") + ".");
  if (!isValidMyPhone(input.customerPhone)) throw new WorkflowError("Enter a valid Malaysian phone number, e.g. 012-345 6789.");
  if (!serviceOptions.includes(input.serviceType)) throw new WorkflowError("Choose a service type from the list.");
  if (!branchOptions.includes(input.branch)) throw new WorkflowError("Choose a branch from the list.");

  let tech: { id: string; name: string; phone: string | null } | null = null;
  if (input.technician) {
    const { data } = await db.from("technicians").select("id,name,phone").eq("name", input.technician).eq("active", true).maybeSingle();
    if (!data) throw new WorkflowError("Technician " + input.technician + " is not available.");
    tech = data;
  }

  const scheduledAt = input.scheduledAt && !Number.isNaN(Date.parse(input.scheduledAt)) ? new Date(input.scheduledAt).toISOString() : null;
  const status: OrderStatus = tech ? "Assigned" : "New";

  const { data: created, error } = await db
    .from("orders")
    .insert({
      customer_name: input.customerName,
      customer_phone: normalizeMyPhone(input.customerPhone),
      address: input.address,
      problem_description: input.problemDescription,
      service_type: input.serviceType,
      quoted_price: Math.round(input.quotedPrice * 100) / 100,
      assigned_technician_id: tech?.id ?? null,
      branch: input.branch,
      status: statusToDb[status],
      admin_notes: input.adminNotes,
      created_by: actor.profileId,
      scheduled_at: scheduledAt
    })
    .select("id, order_no")
    .single();
  if (error) throw error;

  await logActivity(db, actor, created.id, "order_created", null, "New");
  if (tech) {
    await logActivity(db, actor, created.id, "assign", "New", "Assigned", "", { technician: tech.name });
    const message = newJobMessage({
      technicianName: tech.name,
      orderNo: created.order_no,
      serviceType: input.serviceType,
      customerName: input.customerName,
      address: input.address,
      scheduledAt,
      quotedPrice: input.quotedPrice
    });
    await notify(db, { orderId: created.id, channel: "whatsapp", audience: "technician", event: "job_assigned", recipient: tech.phone, message, link: waLink(tech.phone, message) });
  }

  return { orderNo: created.order_no as string };
}

export async function runAction(actor: Actor, orderNo: string, action: WorkflowAction, body: Record<string, unknown>) {
  if (action === "complete") throw new WorkflowError("Use the completion form to finish a job.");
  if (!(action in WORKFLOW)) throw new WorkflowError("Unknown action.");
  const db = serverClient(actor.accessToken);
  const order = await loadOrder(db, orderNo);
  const current = statusFromDb[order.status];
  const check = checkTransition(action, actor.role, current);
  if (!check.ok) throw new WorkflowError(check.error, check.status);

  const note = text(body.notes, 1000);
  const update: Record<string, unknown> = {};

  if (action === "assign") {
    const name = text(body.technician, 80);
    const { data: tech } = await db.from("technicians").select("id,name,phone").eq("name", name).eq("active", true).maybeSingle();
    if (!tech) throw new WorkflowError("Choose an available technician.");
    if (order.technicians?.id === tech.id && current === "Assigned") throw new WorkflowError(tech.name + " is already assigned.");
    update.assigned_technician_id = tech.id;
    update.status = statusToDb.Assigned;
    await db.from("orders").update(update).eq("id", order.id).throwOnError();
    await logActivity(db, actor, order.id, order.technicians ? "reassign" : "assign", current, "Assigned", note, { technician: tech.name, previousTechnician: order.technicians?.name ?? null });
    const message = newJobMessage({
      technicianName: tech.name, orderNo: order.order_no, serviceType: order.service_type, customerName: order.customer_name,
      address: order.address, scheduledAt: order.scheduled_at, quotedPrice: Number(order.quoted_price)
    });
    await notify(db, { orderId: order.id, channel: "whatsapp", audience: "technician", event: "job_assigned", recipient: tech.phone, message, link: waLink(tech.phone, message) });
    return { status: "Assigned" as OrderStatus };
  }

  if (action === "reschedule") {
    const when = text(body.scheduledAt, 40);
    if (!when || Number.isNaN(Date.parse(when))) throw new WorkflowError("Pick a new date and time.");
    await db.from("orders").update({ scheduled_at: new Date(when).toISOString(), reschedule_count: (order.reschedule_count ?? 0) + 1 }).eq("id", order.id).throwOnError();
    await logActivity(db, actor, order.id, "reschedule", current, current, note, { from: order.scheduled_at, to: new Date(when).toISOString() });
    return { status: current };
  }

  if (action === "start" || action === "decline") {
    if (actor.technicianName && order.technicians?.name !== actor.technicianName) {
      throw new WorkflowError("Only the assigned technician can " + action + " this job.", 403);
    }
  }

  if (action === "decline") {
    if (!note) throw new WorkflowError("Tell the admin why you can't take this job.");
    const technician = order.technicians?.name ?? actor.name;
    // Back to New and unassigned, so the admin can pick someone else.
    await db.from("orders").update({ status: statusToDb.New, assigned_technician_id: null }).eq("id", order.id).throwOnError();
    await logActivity(db, actor, order.id, "decline", current, "New", note, { technician });
    await notify(db, {
      orderId: order.id,
      channel: "internal",
      audience: "admin",
      event: "job_declined",
      message: `${order.order_no} declined by ${technician}: ${note}. Needs a new technician.`
    });
    return { status: "New" as OrderStatus };
  }

  const next = check.next;
  await db.from("orders").update({ status: statusToDb[next] }).eq("id", order.id).throwOnError();

  if (action === "approve" || action === "return") {
    await db
      .from("job_reviews")
      .upsert(
        {
          order_id: order.id,
          manager_id: actor.profileId,
          review_status: action === "approve" ? "approved" : "returned",
          review_notes: note || (action === "approve" ? "Approved." : "Returned for correction."),
          reviewed_at: new Date().toISOString()
        },
        { onConflict: "order_id" }
      )
      .throwOnError();
  }

  await logActivity(db, actor, order.id, action, current, next, note);

  if (action === "return" && order.technicians) {
    const message = `Hi ${order.technicians.name}, job ${order.order_no} was returned by the manager.${note ? "\nNote: " + note : ""}\nPlease update the service record.`;
    await notify(db, { orderId: order.id, channel: "whatsapp", audience: "technician", event: "job_returned", recipient: order.technicians.phone, message, link: waLink(order.technicians.phone, message) });
  }

  return { status: next };
}

export async function completeOrder(actor: Actor, orderNo: string, body: Record<string, unknown>) {
  const db = serverClient(actor.accessToken);
  const order = await loadOrder(db, orderNo);
  const current = statusFromDb[order.status];
  const check = checkTransition("complete", actor.role, current);
  if (!check.ok) throw new WorkflowError(check.error, check.status);
  if (!order.technicians) throw new WorkflowError("This job has no assigned technician.");
  if (actor.technicianName && order.technicians.name !== actor.technicianName) {
    throw new WorkflowError("Only the assigned technician can complete this job.", 403);
  }

  const workDone = text(body.workDone);
  if (!workDone) throw new WorkflowError("Describe the work done.");

  const items: ExtraItem[] = Array.isArray(body.extraItems)
    ? (body.extraItems as Array<Record<string, unknown>>)
        .map((item) => ({ label: text(item.label, 80), amount: Math.max(0, Number(item.amount) || 0) }))
        .filter((item) => item.label && item.amount > 0)
        .slice(0, 10)
    : [];
  const itemTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const extraCharges = items.length ? itemTotal : Math.max(0, Number(body.extraCharges) || 0);
  // Server recalculates — never trusts the client's final amount.
  const finalAmount = calculateFinalAmount(Number(order.quoted_price), extraCharges);

  const files = Array.isArray(body.files) ? (body.files as Array<Record<string, unknown>>) : [];
  if (files.length > MAX_EVIDENCE_FILES) throw new WorkflowError("Upload at most " + MAX_EVIDENCE_FILES + " files.");
  for (const file of files) {
    if (typeof file.path !== "string" || !file.path.startsWith(order.order_no + "/")) throw new WorkflowError("Invalid evidence file.");
  }

  const receipt = body.receipt && typeof body.receipt === "object" ? (body.receipt as Record<string, unknown>) : null;
  if (receipt && (typeof receipt.path !== "string" || !receipt.path.startsWith(order.order_no + "/"))) throw new WorkflowError("Invalid receipt file.");

  const paymentAmount = Math.max(0, Number(body.paymentAmount) || 0);
  const paymentMethod = text(body.paymentMethod, 40) || (paymentAmount > 0 ? "Cash" : "Not recorded");
  const completedAt = new Date().toISOString();

  const { data: completion, error } = await db
    .from("service_completions")
    .upsert(
      {
        order_id: order.id,
        technician_id: order.technicians.id,
        work_done: workDone,
        extra_charges: extraCharges,
        extra_items: items,
        final_amount: finalAmount,
        remarks: text(body.remarks),
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        completed_at: completedAt
      },
      { onConflict: "order_id" }
    )
    .select("id")
    .single();
  if (error) throw error;

  if (files.length) {
    await db
      .from("service_files")
      .insert(files.map((file) => ({
        order_id: order.id,
        completion_id: completion.id,
        file_path: String(file.path),
        file_name: text(file.name, 200) || "evidence",
        file_type: text(file.type, 100) || "application/octet-stream",
        uploaded_by: actor.profileId
      })))
      .throwOnError();
  }

  if (receipt) {
    await db
      .from("service_files")
      .insert({
        order_id: order.id,
        completion_id: completion.id,
        file_path: String(receipt.path),
        file_name: text(receipt.name, 200) || "receipt",
        file_type: text(receipt.type, 100) || "image/jpeg",
        uploaded_by: actor.profileId,
        kind: "receipt"
      })
      .throwOnError();
  }

  await db.from("orders").update({ status: statusToDb["Job Done"] }).eq("id", order.id).throwOnError();
  await logActivity(db, actor, order.id, "complete", current, "Job Done", "", { finalAmount, files: files.length });

  // Module 3 trigger: status = Job Done → prepare WhatsApp to customer + alert manager/accounts.
  const message = jobDoneMessage({ customerName: order.customer_name, orderNo: order.order_no, technicianName: order.technicians.name, completedAt });
  const link = waLink(order.customer_phone, message);
  await notify(db, { orderId: order.id, channel: "whatsapp", audience: "customer", event: "job_done", recipient: order.customer_phone, message, link });
  await notify(db, {
    orderId: order.id,
    channel: "internal",
    audience: "manager",
    event: "job_done",
    message: `${order.order_no} completed by ${order.technicians.name} · RM ${finalAmount.toFixed(2)} · ready for review`
  });

  return { status: "Job Done" as OrderStatus, finalAmount, whatsappLink: link, message };
}

export async function markNotification(actor: Actor, id: string, status: "sent" | "read") {
  const db = serverClient(actor.accessToken);
  const { data, error } = await db
    .from("notifications")
    .update({ status, sent_at: status === "sent" ? new Date().toISOString() : undefined })
    .eq("id", id)
    .select("order_id, audience, channel")
    .maybeSingle();
  if (error) throw error;
  if (data && status === "sent" && data.order_id) {
    await logActivity(db, actor, data.order_id, "whatsapp_sent", null, null, "", { audience: data.audience });
  }
  return { ok: true };
}
