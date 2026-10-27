export type OrderStatus = "New" | "Assigned" | "In Progress" | "Job Done" | "Reviewed" | "Closed";

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
  branch: string;
  status: OrderStatus;
  adminNotes: string;
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
