export type LeadStage =
  | "new_inquiry"
  | "follow_up"
  | "review_booked"
  | "review_completed"
  | "proposal_sent"
  | "deposit_received"
  | "won"
  | "lost";

export type LeadSource =
  | "website_form"
  | "referral"
  | "manual"
  | "other";

export type LeadRow = {
  id: string;
  organization_id: string | null;
  contact_id: string | null;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  title: string;
  source: LeadSource;
  stage: LeadStage;
  message: string | null;
  notes: string | null;
  next_follow_up_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
};

export const LEAD_STAGES: Array<{
  value: LeadStage;
  label: string;
}> = [
  { value: "new_inquiry", label: "New inquiry" },
  { value: "follow_up", label: "Follow-up / scheduling" },
  { value: "review_booked", label: "Consult booked" },
  { value: "review_completed", label: "Consult completed" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "deposit_received", label: "Deposit received" },
  { value: "won", label: "Project kicked off" },
  { value: "lost", label: "Lost" },
];

export const LEAD_SOURCES: Array<{
  value: LeadSource;
  label: string;
}> = [
  { value: "website_form", label: "Website form" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "other", label: "Other" },
];

/** Stages that mean the lead became a paying customer. */
export function isCustomerStage(stage: LeadStage) {
  return stage === "deposit_received" || stage === "won";
}

export function leadStageLabel(stage: LeadStage) {
  return LEAD_STAGES.find((item) => item.value === stage)?.label ?? stage;
}

export function leadSourceLabel(source: LeadSource) {
  return LEAD_SOURCES.find((item) => item.value === source)?.label ?? source;
}

export function emptyLeadFormValues() {
  return {
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    title: "Free Process Review",
    source: "manual" as LeadSource,
    stage: "new_inquiry" as LeadStage,
    message: "",
    notes: "",
    nextFollowUpAt: "",
    lostReason: "",
  };
}

export function leadRowToFormValues(row: LeadRow) {
  return {
    businessName: row.business_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone ?? "",
    title: row.title,
    source: row.source,
    stage: row.stage,
    message: row.message ?? "",
    notes: row.notes ?? "",
    nextFollowUpAt: row.next_follow_up_at ?? "",
    lostReason: row.lost_reason ?? "",
  };
}
