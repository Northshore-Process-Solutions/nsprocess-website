import {
  todayDateOnly,
  type LineItemInput,
} from "@/lib/billing";

export type AgreementStatus = "draft" | "sent" | "signed" | "void";

export type AgreementRow = {
  id: string;
  agreement_number: string;
  title: string;
  status: AgreementStatus;
  proposal_id: string | null;
  lead_id: string | null;
  organization_id: string | null;
  client_business_name: string;
  client_contact_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  issued_at: string;
  scope_summary: string | null;
  terms: string | null;
  notes: string | null;
  deposit_percent: number | string | null;
  subtotal: number | string;
  total_amount: number | string;
  signer_name: string | null;
  signed_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AgreementItemRow = {
  id: string;
  agreement_id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
  sort_order: number;
  created_at: string;
};

export type AgreementWithItems = AgreementRow & {
  agreement_items?: AgreementItemRow[] | null;
  proposals?: { id: string; proposal_number: string; title: string } | null;
  organizations?: { id: string; name: string } | null;
};

export const AGREEMENT_STATUSES: Array<{
  value: AgreementStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
  { value: "void", label: "Void" },
];

export const DEFAULT_AGREEMENT_TERMS = `By signing below, the client accepts the scope and investment described in this agreement.

Payment: A deposit of the stated percentage is due upon signing to reserve the engagement. Remaining balance follows the line items or milestone schedule.

Scope: Work is limited to the items listed here. Changes may adjust timeline and investment.

Scheduling: Kickoff timing is confirmed after the deposit is received.`;

export function agreementStatusLabel(status: AgreementStatus | string) {
  return (
    AGREEMENT_STATUSES.find((item) => item.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

export function emptyAgreementFormValues(defaults?: {
  title?: string;
  clientBusinessName?: string;
  clientContactName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
  proposalId?: string | null;
  scopeSummary?: string | null;
  terms?: string | null;
  depositPercent?: string | null;
  items?: LineItemInput[];
}) {
  return {
    title: defaults?.title ?? "Process Improvement Agreement",
    status: "draft" as AgreementStatus,
    proposalId: defaults?.proposalId ?? "",
    leadId: defaults?.leadId ?? "",
    organizationId: defaults?.organizationId ?? "",
    clientBusinessName: defaults?.clientBusinessName ?? "",
    clientContactName: defaults?.clientContactName ?? "",
    clientEmail: defaults?.clientEmail ?? "",
    clientPhone: defaults?.clientPhone ?? "",
    issuedAt: todayDateOnly(),
    scopeSummary: defaults?.scopeSummary ?? "",
    terms: defaults?.terms ?? DEFAULT_AGREEMENT_TERMS,
    notes: "",
    depositPercent: defaults?.depositPercent ?? "50",
    signerName: "",
    items: defaults?.items ?? [
      {
        description: "Process improvement engagement",
        quantity: "1",
        unitPrice: "",
      },
    ],
  };
}

export function agreementToFormValues(agreement: AgreementWithItems) {
  const items =
    agreement.agreement_items && agreement.agreement_items.length > 0
      ? [...agreement.agreement_items]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            description: item.description,
            quantity: String(item.quantity ?? "1"),
            unitPrice: String(item.unit_price ?? ""),
          }))
      : [{ description: "", quantity: "1", unitPrice: "" }];

  return {
    title: agreement.title,
    status: agreement.status,
    proposalId: agreement.proposal_id ?? "",
    leadId: agreement.lead_id ?? "",
    organizationId: agreement.organization_id ?? "",
    clientBusinessName: agreement.client_business_name,
    clientContactName: agreement.client_contact_name ?? "",
    clientEmail: agreement.client_email ?? "",
    clientPhone: agreement.client_phone ?? "",
    issuedAt: agreement.issued_at,
    scopeSummary: agreement.scope_summary ?? "",
    terms: agreement.terms ?? DEFAULT_AGREEMENT_TERMS,
    notes: agreement.notes ?? "",
    depositPercent:
      agreement.deposit_percent === null ||
      agreement.deposit_percent === undefined
        ? ""
        : String(agreement.deposit_percent),
    signerName: agreement.signer_name ?? "",
    items,
  };
}
