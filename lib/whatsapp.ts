import { normalizeMyPhone } from "./phone";
import { formatTime, formatDate, money } from "./format";

/** wa.me deep link. Without a phone, WhatsApp opens the contact picker with the message filled in. */
export function waLink(phone: string | null | undefined, message: string) {
  const digits = phone ? normalizeMyPhone(phone) : "";
  return "https://wa.me/" + digits + "?text=" + encodeURIComponent(message);
}

/** Module 3 template, word for word from the assessment. */
export function jobDoneMessage(input: { customerName: string; orderNo: string; technicianName: string; completedAt: string }) {
  const time = formatTime(input.completedAt) + " on " + formatDate(input.completedAt, { day: "numeric", month: "short" });
  return (
    `Hi ${input.customerName},\n` +
    `Job ${input.orderNo} has been completed by Technician ${input.technicianName} at ${time}.\n` +
    `Please check and leave feedback.\n` +
    `Thank you!`
  );
}

/** Module 1 bonus: tell the technician about a new job. */
export function newJobMessage(input: {
  technicianName: string;
  orderNo: string;
  serviceType: string;
  customerName: string;
  address: string;
  scheduledAt: string | null;
  quotedPrice: number;
}) {
  const slot = input.scheduledAt ? formatDate(input.scheduledAt, { weekday: "short", day: "numeric", month: "short" }) + ", " + formatTime(input.scheduledAt) : "To be confirmed";
  return (
    `Hi ${input.technicianName}, new job assigned.\n` +
    `${input.orderNo} · ${input.serviceType}\n` +
    `Customer: ${input.customerName}\n` +
    `Address: ${input.address}\n` +
    `When: ${slot}\n` +
    `Quoted: ${money(input.quotedPrice)}`
  );
}
