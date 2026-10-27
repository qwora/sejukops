import type { ServiceOrder } from "./order-types";

export const DEMO_ORDERS_KEY = "sejuksejuk.demo.orders";

export const seedOrders: ServiceOrder[] = [
  {
    id: "order-1234",
    orderNo: "ORDER1234",
    customerName: "Ahmad Rahman",
    customerPhone: "60123456789",
    address: "No. 12, Jalan Sejuk, Shah Alam",
    problemDescription: "Indoor unit is leaking water after running for 30 minutes.",
    serviceType: "Aircond cleaning",
    quotedPrice: 180,
    assignedTechnician: "",
    branch: "Shah Alam",
    status: "New",
    adminNotes: "",
    createdAt: "2026-10-27T01:42:00.000Z"
  },
  {
    id: "order-1235",
    orderNo: "ORDER1235",
    customerName: "Siti Aminah",
    customerPhone: "60129876543",
    address: "22, Jalan Harmoni, Kuala Lumpur",
    problemDescription: "Air conditioner is not cooling properly.",
    serviceType: "Wall-mounted repair",
    quotedPrice: 320,
    assignedTechnician: "Ali",
    branch: "Kuala Lumpur",
    status: "Assigned",
    adminNotes: "Customer prefers a call before arrival.",
    createdAt: "2026-10-27T00:15:00.000Z"
  },
  {
    id: "order-1236",
    orderNo: "ORDER1236",
    customerName: "Lee Wei Ming",
    customerPhone: "60127778899",
    address: "18, Jalan Murni, Petaling Jaya",
    problemDescription: "Unit has weak airflow and unusual noise.",
    serviceType: "Gas refill",
    quotedPrice: 240,
    assignedTechnician: "Bala",
    branch: "Petaling Jaya",
    status: "In Progress",
    adminNotes: "",
    createdAt: "2026-10-26T03:10:00.000Z"
  },
  {
    id: "order-1237",
    orderNo: "ORDER1237",
    customerName: "Nadia Yusuf",
    customerPhone: "60121112222",
    address: "7, Jalan Bayu, Langkawi",
    problemDescription: "New installation for two wall-mounted units.",
    serviceType: "Installation",
    quotedPrice: 850,
    assignedTechnician: "Yusoff",
    branch: "Langkawi",
    status: "Job Done",
    adminNotes: "",
    createdAt: "2026-10-26T02:00:00.000Z"
  }
];

export function readDemoOrders(): ServiceOrder[] {
  if (typeof window === "undefined") return seedOrders;

  const stored = window.localStorage.getItem(DEMO_ORDERS_KEY);
  if (!stored) {
    window.localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(seedOrders));
    return seedOrders;
  }

  try {
    return JSON.parse(stored) as ServiceOrder[];
  } catch {
    window.localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(seedOrders));
    return seedOrders;
  }
}

export function saveDemoOrders(orders: ServiceOrder[]) {
  window.localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
}

export function createOrderNumber(existingOrders: ServiceOrder[]) {
  const highest = existingOrders.reduce((max, order) => {
    const numericPart = Number(order.orderNo.replace("ORDER", ""));
    return Number.isFinite(numericPart) ? Math.max(max, numericPart) : max;
  }, 1233);

  return "ORDER" + String(highest + 1);
}
