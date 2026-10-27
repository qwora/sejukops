/** Normalise a Malaysian phone number to digits with country code (e.g. 60123456789). */
export function normalizeMyPhone(input: string) {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "6" + digits;
  if (digits.startsWith("1") && digits.length >= 9 && digits.length <= 10) digits = "60" + digits;
  return digits;
}

export function isValidMyPhone(input: string) {
  const digits = normalizeMyPhone(input);
  return /^60\d{8,10}$/.test(digits);
}

/** 60123456789 → +60 12-345 6789 */
export function formatMyPhone(input: string) {
  const digits = normalizeMyPhone(input);
  if (!digits.startsWith("60")) return input;
  const local = digits.slice(2);
  const prefix = local.startsWith("11") ? local.slice(0, 3) : local.slice(0, 2);
  const rest = local.slice(prefix.length);
  const split = rest.length > 4 ? rest.slice(0, rest.length - 4) + " " + rest.slice(-4) : rest;
  return `+60 ${prefix}-${split}`;
}
