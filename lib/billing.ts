export type LineItemInput = {
  description: string;
  quantity: string;
  unitPrice: string;
};

export function formatMoney(amount: number | string | null | undefined) {
  const value = Number(amount ?? 0);
  if (Number.isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function computeLineTotal(quantity: number, unitPrice: number) {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function computeTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + computeLineTotal(item.quantity, item.unitPrice),
    0,
  );
  const rounded = Math.round(subtotal * 100) / 100;
  return { subtotal: rounded, total: rounded };
}

export function todayDateOnly() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function addDaysDateOnly(days: number, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseLineItems(items: LineItemInput[]) {
  if (!items.length) {
    return { error: "Add at least one line item." as const };
  }

  const parsed: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  for (const [index, item] of items.entries()) {
    const description = item.description.trim();
    if (!description) {
      return { error: `Line ${index + 1}: description is required.` as const };
    }
    const quantity = Number(item.quantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      return { error: `Line ${index + 1}: quantity must be valid.` as const };
    }
    const unitPrice = Number(item.unitPrice);
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      return { error: `Line ${index + 1}: unit price must be valid.` as const };
    }
    parsed.push({
      description,
      quantity,
      unitPrice,
      lineTotal: computeLineTotal(quantity, unitPrice),
    });
  }

  return { items: parsed };
}

export async function nextDocumentNumber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: "agreements" | "invoices" | "proposals",
  numberColumn: string,
  prefix: string,
) {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;

  const { data } = await supabase
    .from(table)
    .select(numberColumn)
    .like(numberColumn, `${fullPrefix}%`)
    .order(numberColumn, { ascending: false })
    .limit(20);

  let max = 0;
  for (const row of data ?? []) {
    const value = String(row[numberColumn] ?? "");
    const suffix = value.replace(fullPrefix, "");
    const num = Number(suffix);
    if (!Number.isNaN(num) && num > max) max = num;
  }

  return `${fullPrefix}${String(max + 1).padStart(4, "0")}`;
}
