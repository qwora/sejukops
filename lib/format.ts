export const TIME_ZONE = "Asia/Kuala_Lumpur";

export function money(value: number, decimals = 2) {
  return "RM " + Number(value || 0).toLocaleString("en-MY", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-MY", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-MY", { timeZone: TIME_ZONE, ...opts });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatDate(iso, { day: "numeric", month: "short" }) + ", " + formatTime(iso);
}

/** YYYY-MM-DD in Malaysia time */
export function dayKey(date: Date | string) {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function isToday(iso: string | null | undefined) {
  return !!iso && dayKey(iso) === dayKey(new Date());
}

/** Friendly "Today 14:00", "Tomorrow 10:00", "Wed 28 Oct, 10:00" */
export function relativeSlot(iso: string | null | undefined) {
  if (!iso) return "Not scheduled";
  const today = dayKey(new Date());
  const tomorrow = dayKey(new Date(Date.now() + 86400000));
  const key = dayKey(iso);
  if (key === today) return "Today " + formatTime(iso);
  if (key === tomorrow) return "Tomorrow " + formatTime(iso);
  return formatDate(iso, { weekday: "short", day: "numeric", month: "short" }) + ", " + formatTime(iso);
}

export function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + "h ago";
  return formatDate(iso);
}

/** Start of a Malaysia-time day as a UTC Date. */
export function startOfMyDay(date = new Date()) {
  const key = dayKey(date);
  return new Date(key + "T00:00:00+08:00");
}

/** Monday 00:00 Malaysia time of the week containing `date`, shifted by `offsetWeeks`. */
export function startOfMyWeek(date = new Date(), offsetWeeks = 0) {
  const start = startOfMyDay(date);
  const weekday = new Date(dayKey(date) + "T12:00:00+08:00").getUTCDay(); // 0 = Sunday
  const back = weekday === 0 ? 6 : weekday - 1;
  return new Date(start.getTime() - back * 86400000 + offsetWeeks * 7 * 86400000);
}

export function startOfMyMonth(date = new Date()) {
  const key = dayKey(date).slice(0, 7);
  return new Date(key + "-01T00:00:00+08:00");
}

export function initials(name: string) {
  return (name || "?").trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

/*
 * <input type="datetime-local"> has no timezone. The business runs on Malaysia time,
 * so we always read and write these values as Asia/Kuala_Lumpur (UTC+8), whatever
 * timezone the viewer's computer is set to.
 */
const MY_OFFSET_MS = 8 * 3600000;

/** "2026-10-28T11:00" (Malaysia time) → ISO string, or null when empty/invalid. */
export function myLocalInputToIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.slice(0, 16) + ":00+08:00");
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO string → "YYYY-MM-DDTHH:mm" in Malaysia time, for datetime-local inputs. */
export function isoToMyLocalInput(iso: string | Date) {
  return new Date(new Date(iso).getTime() + MY_OFFSET_MS).toISOString().slice(0, 16);
}
