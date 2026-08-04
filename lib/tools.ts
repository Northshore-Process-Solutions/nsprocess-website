export type ToolStatus =
  | "active"
  | "trial"
  | "inactive"
  | "cancelled"
  | "replacing";

export type BillingCadence =
  | "monthly"
  | "yearly"
  | "one_time"
  | "usage"
  | "free";

export type ToolRow = {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  admin_url: string | null;
  account_email: string | null;
  plan: string | null;
  billing_amount: number | string | null;
  billing_cadence: BillingCadence;
  renewal_date: string | null;
  status: ToolStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const TOOL_STATUSES: ToolStatus[] = [
  "active",
  "trial",
  "inactive",
  "cancelled",
  "replacing",
];

export const BILLING_CADENCES: BillingCadence[] = [
  "monthly",
  "yearly",
  "one_time",
  "usage",
  "free",
];

export function emptyToolFormValues() {
  return {
    name: "",
    category: "",
    website: "",
    adminUrl: "",
    accountEmail: "",
    plan: "",
    billingAmount: "",
    billingCadence: "monthly" as BillingCadence,
    renewalDate: "",
    status: "active" as ToolStatus,
    notes: "",
  };
}

export function toolRowToFormValues(row: ToolRow) {
  return {
    name: row.name,
    category: row.category ?? "",
    website: row.website ?? "",
    adminUrl: row.admin_url ?? "",
    accountEmail: row.account_email ?? "",
    plan: row.plan ?? "",
    billingAmount:
      row.billing_amount === null || row.billing_amount === undefined
        ? ""
        : String(row.billing_amount),
    billingCadence: row.billing_cadence,
    renewalDate: row.renewal_date ?? "",
    status: row.status,
    notes: row.notes ?? "",
  };
}

export function formatBilling(
  amount: number | string | null,
  cadence: BillingCadence,
) {
  if (cadence === "free") return "Free";
  if (cadence === "usage") {
    return amount ? `Usage / ~$${Number(amount).toFixed(2)}` : "Usage-based";
  }
  if (amount === null || amount === undefined || amount === "") {
    return cadence.replaceAll("_", " ");
  }

  const formatted = `$${Number(amount).toFixed(2)}`;
  if (cadence === "one_time") return `${formatted} one-time`;
  return `${formatted}/${cadence === "yearly" ? "yr" : "mo"}`;
}
