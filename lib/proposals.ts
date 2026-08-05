export type ProposalStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

export type ProposalRow = {
  id: string;
  proposal_number: string;
  title: string;
  status: ProposalStatus;
  lead_id: string | null;
  organization_id: string | null;
  client_business_name: string;
  client_contact_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  issued_at: string;
  valid_until: string | null;
  scope_summary: string | null;
  terms: string | null;
  notes: string | null;
  deposit_percent: number | string | null;
  subtotal: number | string;
  total_amount: number | string;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProposalItemRow = {
  id: string;
  proposal_id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
  sort_order: number;
  created_at: string;
};

export type ProposalWithItems = ProposalRow & {
  proposal_items?: ProposalItemRow[] | null;
  leads?: {
    id: string;
    business_name: string;
    stage: string;
  } | null;
  organizations?: {
    id: string;
    name: string;
  } | null;
};

export type ProposalItemInput = {
  description: string;
  quantity: string;
  unitPrice: string;
};

export const PROPOSAL_STATUSES: Array<{
  value: ProposalStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
];

export const PROPOSAL_LINE_SLOT_COUNT = 8;

export const DEFAULT_PROPOSAL_TERMS = `Payment: A deposit of the stated percentage is due upon acceptance to reserve the engagement. Remaining balance follows the line items or milestone schedule.

Scope: Work is limited to the items listed in this proposal. Changes may adjust timeline and investment.

Validity: This proposal is valid through the date shown above unless extended in writing. Kickoff is confirmed after deposit is received.`;

/** Drop leading "Business — " when title repeats the client name. */
export function proposalDisplayTitle(
  title: string,
  clientBusinessName: string,
) {
  const trimmedTitle = title.trim();
  const business = clientBusinessName.trim();
  if (!business) return trimmedTitle;

  const prefix = `${business} — `;
  const prefixDash = `${business} - `;
  if (trimmedTitle.startsWith(prefix)) {
    return trimmedTitle.slice(prefix.length).trim() || trimmedTitle;
  }
  if (trimmedTitle.startsWith(prefixDash)) {
    return trimmedTitle.slice(prefixDash.length).trim() || trimmedTitle;
  }
  if (trimmedTitle === business) return "Process Improvement Proposal";
  return trimmedTitle;
}

export function proposalStatusLabel(status: ProposalStatus | string) {
  return (
    PROPOSAL_STATUSES.find((item) => item.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

export function formatProposalMoney(amount: number | string | null | undefined) {
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

export function computeProposalTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  depositPercent?: number | null,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + computeLineTotal(item.quantity, item.unitPrice),
    0,
  );
  const rounded = Math.round(subtotal * 100) / 100;
  const deposit =
    depositPercent === null || depositPercent === undefined
      ? null
      : Math.round(rounded * (depositPercent / 100) * 100) / 100;
  return { subtotal: rounded, total: rounded, depositAmount: deposit };
}

export function defaultValidUntil(issuedAt = new Date()) {
  const date = new Date(issuedAt);
  date.setDate(date.getDate() + 30);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayDateOnly() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function emptyProposalFormValues(defaults?: {
  clientBusinessName?: string;
  clientContactName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
  title?: string;
}) {
  const issuedAt = todayDateOnly();
  return {
    title: defaults?.title ?? "Process Improvement Proposal",
    status: "draft" as ProposalStatus,
    leadId: defaults?.leadId ?? "",
    organizationId: defaults?.organizationId ?? "",
    clientBusinessName: defaults?.clientBusinessName ?? "",
    clientContactName: defaults?.clientContactName ?? "",
    clientEmail: defaults?.clientEmail ?? "",
    clientPhone: defaults?.clientPhone ?? "",
    issuedAt,
    validUntil: defaultValidUntil(),
    scopeSummary: "",
    terms: DEFAULT_PROPOSAL_TERMS,
    notes: "",
    depositPercent: "50",
    items: [
      {
        description: "Process improvement engagement",
        quantity: "1",
        unitPrice: "",
      },
    ] as ProposalItemInput[],
  };
}

export function proposalToFormValues(proposal: ProposalWithItems) {
  const items =
    proposal.proposal_items && proposal.proposal_items.length > 0
      ? [...proposal.proposal_items]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            description: item.description,
            quantity: String(item.quantity ?? "1"),
            unitPrice: String(item.unit_price ?? ""),
          }))
      : [{ description: "", quantity: "1", unitPrice: "" }];

  return {
    title: proposal.title,
    status: proposal.status,
    leadId: proposal.lead_id ?? "",
    organizationId: proposal.organization_id ?? "",
    clientBusinessName: proposal.client_business_name,
    clientContactName: proposal.client_contact_name ?? "",
    clientEmail: proposal.client_email ?? "",
    clientPhone: proposal.client_phone ?? "",
    issuedAt: proposal.issued_at,
    validUntil: proposal.valid_until ?? "",
    scopeSummary: proposal.scope_summary ?? "",
    terms: proposal.terms ?? DEFAULT_PROPOSAL_TERMS,
    notes: proposal.notes ?? "",
    depositPercent:
      proposal.deposit_percent === null || proposal.deposit_percent === undefined
        ? ""
        : String(proposal.deposit_percent),
    items,
  };
}
