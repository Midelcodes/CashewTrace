// Nigerian phone numbers are stored as 11 local digits ("08031234567").

/** "+234 803 123 4567" / "0803-123-4567" / "8031234567" → "08031234567" */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  if (digits.length === 10) digits = `0${digits}`;
  return digits;
}

/** "08031234567" → "0803 123 4567" */
export function formatPhone(digits: string): string {
  return digits.length === 11
    ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    : digits;
}
