export type OrderStatus = "New" | "Assigned" | "In Progress" | "Job Done" | "Reviewed" | "Closed";

export const ORDER_STATUSES: OrderStatus[] = ["New", "Assigned", "In Progress", "Job Done", "Reviewed", "Closed"];

export type ServiceOrder = {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  problemDescription: string;
  serviceType: string;
  quotedPrice: number;
  assignedTechnician: string;
  technicianId: string | null;
  branch: string;
  status: OrderStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  rescheduleCount: number;
};

export type Technician = {
  id: string;
  name: string;
  phone: string | null;
  branch: string | null;
  profileId: string | null;
};

export type ExtraItem = { label: string; amount: number };

export type ServiceCompletion = {
  id: string;
  orderId: string;
  orderNo: string;
  technicianName: string;
  workDone: string;
  extraCharges: number;
  extraItems: ExtraItem[];
  finalAmount: number;
  remarks: string;
  paymentAmount: number;
  paymentMethod: string;
  files: Array<{ name: string; path: string; type: string }>;
  receipt: { name: string; path: string; type: string } | null;
  completedAt: string;
};

export type ActivityEntry = {
  id: string;
  action: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus | null;
  actor: string;
  note: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  orderId: string | null;
  orderNo: string;
  channel: "whatsapp" | "internal";
  audience: "customer" | "technician" | "manager" | "admin";
  event: string;
  recipient: string | null;
  message: string;
  link: string | null;
  status: "ready" | "sent" | "read";
  createdAt: string;
};

export const technicianOptions = ["Ali", "John", "Bala", "Yusoff"];

export const serviceOptions = [
  "Aircond cleaning",
  "Wall-mounted repair",
  "Gas refill",
  "Installation",
  "Preventive maintenance"
];

export const branchOptions = ["Kuala Lumpur", "Shah Alam", "Petaling Jaya", "Langkawi", "Penang"];

export const paymentMethods = ["Cash", "QR payment", "Bank transfer", "Card"];
