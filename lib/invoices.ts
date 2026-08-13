import {
  addDaysDateOnly,
  todayDateOnly,
  type LineItemInput,
} from "@/lib/billing";

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type InvoiceType = "deposit" | "progress" | "final" | "other";

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  title: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  agreement_id: string | null;
  proposal_id: string | null;
  lead_id: string | null;
  organization_id: string | null;
  project_id: string | null;
  client_business_name: string;
  client_contact_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  issued_at: string;
  due_at: string | null;
  notes: string | null;
  subtotal: number | string;
  total_amount: number | string;
  amount_paid: number | string;
  sent_at: string | null;
  paid_at: string | null;
  share_token: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_nudge_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
  sort_order: number;
  created_at: string;
};

export type InvoiceWithItems = InvoiceRow & {
  invoice_items?: InvoiceItemRow[] | null;
  organizations?: { id: string; name: string } | null;
  agreements?: { id: string; agreement_number: string; title: string } | null;
};

export const INVOICE_STATUSES: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export const INVOICE_TYPES: Array<{ value: InvoiceType; label: string }> = [
  { value: "deposit", label: "Deposit" },
  { value: "progress", label: "Progress" },
  { value: "final", label: "Final" },
  { value: "other", label: "Other" },
];

export function invoiceStatusLabel(status: InvoiceStatus | string) {
  return (
    INVOICE_STATUSES.find((item) => item.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

export function invoiceTypeLabel(type: InvoiceType | string) {
  return (
    INVOICE_TYPES.find((item) => item.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

export function invoiceBalance(invoice: {
  total_amount: number | string;
  amount_paid: number | string;
}) {
  return Math.max(
    0,
    Math.round(
      (Number(invoice.total_amount ?? 0) - Number(invoice.amount_paid ?? 0)) *
        100,
    ) / 100,
  );
}

export function emptyInvoiceFormValues(defaults?: {
  title?: string;
  invoiceType?: InvoiceType;
  clientBusinessName?: string;
  clientContactName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
  agreementId?: string | null;
  proposalId?: string | null;
  projectId?: string | null;
  items?: LineItemInput[];
}) {
  return {
    title: defaults?.title ?? "Invoice",
    invoiceType: defaults?.invoiceType ?? ("other" as InvoiceType),
    status: "draft" as InvoiceStatus,
    agreementId: defaults?.agreementId ?? "",
    proposalId: defaults?.proposalId ?? "",
    leadId: defaults?.leadId ?? "",
    organizationId: defaults?.organizationId ?? "",
    projectId: defaults?.projectId ?? "",
    clientBusinessName: defaults?.clientBusinessName ?? "",
    clientContactName: defaults?.clientContactName ?? "",
    clientEmail: defaults?.clientEmail ?? "",
    clientPhone: defaults?.clientPhone ?? "",
    issuedAt: todayDateOnly(),
    dueAt: addDaysDateOnly(14),
    notes: "",
    amountPaid: "0",
    items: defaults?.items ?? [
      { description: "", quantity: "1", unitPrice: "" },
    ],
  };
}

export function invoiceToFormValues(invoice: InvoiceWithItems) {
  const items =
    invoice.invoice_items && invoice.invoice_items.length > 0
      ? [...invoice.invoice_items]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            description: item.description,
            quantity: String(item.quantity ?? "1"),
            unitPrice: String(item.unit_price ?? ""),
          }))
      : [{ description: "", quantity: "1", unitPrice: "" }];

  return {
    title: invoice.title,
    invoiceType: invoice.invoice_type,
    status: invoice.status,
    agreementId: invoice.agreement_id ?? "",
    proposalId: invoice.proposal_id ?? "",
    leadId: invoice.lead_id ?? "",
    organizationId: invoice.organization_id ?? "",
    projectId: invoice.project_id ?? "",
    clientBusinessName: invoice.client_business_name,
    clientContactName: invoice.client_contact_name ?? "",
    clientEmail: invoice.client_email ?? "",
    clientPhone: invoice.client_phone ?? "",
    issuedAt: invoice.issued_at,
    dueAt: invoice.due_at ?? "",
    notes: invoice.notes ?? "",
    amountPaid: String(invoice.amount_paid ?? "0"),
    items,
  };
}
