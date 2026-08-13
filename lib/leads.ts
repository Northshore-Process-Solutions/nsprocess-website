export type LeadStage =
  | "new_inquiry"
  | "follow_up"
  | "review_booked"
  | "review_completed"
  | "proposal_sent"
  | "proposal_accepted"
  | "deposit_received"
  | "won"
  | "lost";

export type LeadSource =
  | "website_form"
  | "referral"
  | "manual"
  | "other";

export type LeadInsight = {
  companySnapshot: string;
  fit: string;
  talkingPoints: string[];
  nextStep: string;
  risks: string | null;
};

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
  spam_flag: boolean;
  spam_reason: string | null;
  spam_scanned_at: string | null;
  research_summary: string | null;
  research_sources: Array<{ url: string; title?: string | null }> | null;
  researched_at: string | null;
  lead_insight: LeadInsight | null;
  insight_generated_at: string | null;
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
  { value: "proposal_accepted", label: "Proposal accepted" },
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

/**
 * Next pipeline stage when a linked proposal changes status.
 * Returns null when the lead stage should not change.
 */
export function nextLeadStageForProposalStatus(
  currentStage: LeadStage,
  proposalStatus: "draft" | "sent" | "accepted" | "declined" | "expired",
): LeadStage | null {
  if (
    currentStage === "deposit_received" ||
    currentStage === "won" ||
    currentStage === "lost"
  ) {
    return null;
  }

  if (proposalStatus === "sent") {
    if (
      currentStage === "proposal_sent" ||
      currentStage === "proposal_accepted"
    ) {
      return null;
    }
    return "proposal_sent";
  }

  if (proposalStatus === "accepted") {
    if (currentStage === "proposal_accepted") return null;
    return "proposal_accepted";
  }

  return null;
}

const FOLLOW_UP_TIMEZONE = "America/New_York";
const FOLLOW_UP_CUTOFF_HOUR = 14; // 2:00 PM Eastern

/**
 * Default next-follow-up date for a new lead.
 * Before 2pm Eastern → same calendar day; at/after 2pm → next calendar day.
 */
export function defaultNextFollowUpDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FOLLOW_UP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");

  const pad = (value: number) => String(value).padStart(2, "0");
  const today = `${year}-${pad(month)}-${pad(day)}`;

  if (hour < FOLLOW_UP_CUTOFF_HOUR) {
    return today;
  }

  // Advance one calendar day without depending on the server's local timezone.
  const next = new Date(`${today}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
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
    nextFollowUpAt: defaultNextFollowUpDate(),
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
