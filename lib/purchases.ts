export type PurchaseType = "promo" | "equipment" | "supplies" | "other";

export type PurchaseRow = {
  id: string;
  name: string;
  purchase_type: PurchaseType;
  amount: number | string;
  purchased_at: string;
  quantity: number | string | null;
  organization_id: string | null;
  project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseWithRelations = PurchaseRow & {
  organizations?: {
    id: string;
    name: string;
  } | null;
  projects?: {
    id: string;
    name: string;
  } | null;
};

export const PURCHASE_TYPES: Array<{
  value: PurchaseType;
  label: string;
}> = [
  { value: "promo", label: "Promo" },
  { value: "equipment", label: "Equipment" },
  { value: "supplies", label: "Supplies" },
  { value: "other", label: "Other" },
];

export function purchaseTypeLabel(type: PurchaseType | string) {
  return (
    PURCHASE_TYPES.find((item) => item.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

export function formatPurchaseAmount(amount: number | string | null) {
  const value = Number(amount ?? 0);
  if (Number.isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function emptyPurchaseFormValues(defaults?: {
  organizationId?: string | null;
  projectId?: string | null;
}) {
  const today = new Date();
  const purchasedAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return {
    name: "",
    purchaseType: "promo" as PurchaseType,
    amount: "",
    purchasedAt,
    quantity: "1",
    organizationId: defaults?.organizationId ?? "",
    projectId: defaults?.projectId ?? "",
    notes: "",
  };
}

export function purchaseRowToFormValues(row: PurchaseRow) {
  return {
    name: row.name,
    purchaseType: row.purchase_type,
    amount: String(row.amount ?? ""),
    purchasedAt: row.purchased_at,
    quantity:
      row.quantity === null || row.quantity === undefined
        ? ""
        : String(row.quantity),
    organizationId: row.organization_id ?? "",
    projectId: row.project_id ?? "",
    notes: row.notes ?? "",
  };
}
