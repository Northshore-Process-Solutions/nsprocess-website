/**
 * Normalize a US phone number to `(XXX) XXX-XXXX`.
 * Accepts common inputs like `9785550184`, `978-555-0184`, `(978) 555-0184`, `+1 978 555 0184`.
 * Returns null for empty values. Returns null when the value is present but not a valid US number.
 */
export function normalizeUsPhone(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");

  let local = digits;
  if (local.length === 11 && local.startsWith("1")) {
    local = local.slice(1);
  }

  if (local.length !== 10) {
    return null;
  }

  const area = local.slice(0, 3);
  const exchange = local.slice(3, 6);
  const line = local.slice(6);

  return `(${area}) ${exchange}-${line}`;
}

export function isValidUsPhone(value?: string | null): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  return normalizeUsPhone(trimmed) !== null;
}
