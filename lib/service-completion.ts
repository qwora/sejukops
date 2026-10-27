import type { ServiceOrder } from "./order-types";

export type ServiceCompletion = {
  id: string;
  orderNo: string;
  technicianName: string;
  workDone: string;
  extraCharges: number;
  finalAmount: number;
  remarks: string;
  paymentAmount: number;
  paymentMethod: string;
  fileNames: string[];
  completedAt: string;
};

export const COMPLETIONS_KEY = "sejuksejuk.demo.completions";

export function readCompletions(): ServiceCompletion[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(COMPLETIONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as ServiceCompletion[];
  } catch {
    return [];
  }
}

export function saveCompletion(completion: ServiceCompletion) {
  const current = readCompletions().filter((item) => item.orderNo !== completion.orderNo);
  window.localStorage.setItem(COMPLETIONS_KEY, JSON.stringify([completion, ...current]));
}

export function markOrderDone(order: ServiceOrder) {
  return {
    ...order,
    status: "Job Done" as const,
    updatedAt: new Date().toISOString()
  };
}
