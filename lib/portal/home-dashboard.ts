import { formatMoney } from "@/lib/billing";
import { calendarEventTypeLabel } from "@/lib/calendar";
import type { InvoiceRow } from "@/lib/invoices";
import { invoiceBalance } from "@/lib/invoices";
import {
  leadStageLabel,
  type LeadRow,
  type LeadStage,
} from "@/lib/leads";
import type { ProposalRow } from "@/lib/proposals";
import type { ProjectWithOrganization } from "@/lib/projects";
import type { PortalMode } from "@/lib/portal/paths";
import { portalPath } from "@/lib/portal/paths";

export type StatusTone =
  | "gray"
  | "blue"
  | "orange"
  | "green"
  | "purple"
  | "darkGreen"
  | "red";

export type HomeQueueItem = {
  key: string;
  href: string;
  title: string;
  nextAction: string;
  badge: { label: string; tone: StatusTone };
  dueLabel?: string | null;
  spamFlag?: boolean;
  spamReason?: string | null;
};

export type AgreementLite = {
  id: string;
  status: string;
  proposal_id: string | null;
  lead_id: string | null;
};

type EventLite = {
  id: string;
  title: string;
  starts_at: string;
  event_type: string;
};

const PRE_ACCEPT_STAGES: LeadStage[] = [
  "new_inquiry",
  "follow_up",
  "review_booked",
  "review_completed",
  "proposal_sent",
];

export function buildHomeDashboard(input: {
  mode: PortalMode;
  leadsDue: LeadRow[];
  readyToPropose: LeadRow[];
  draftProposals: ProposalRow[];
  sentProposals: ProposalRow[];
  acceptedProposals: ProposalRow[];
  /** Lead ids already past acceptance into customer/project stages. */
  customerLeadIds?: Set<string>;
  agreements: AgreementLite[];
  invoices: InvoiceRow[];
  events: EventLite[];
  projects: ProjectWithOrganization[];
  today?: string;
}) {
  const href = (path = "") => portalPath(input.mode, path);
  const today = input.today ?? todayDateOnly();
  const customerLeadIds = input.customerLeadIds ?? new Set<string>();
  const coveredLeadIds = new Set<string>();

  const pipeline: HomeQueueItem[] = [];

  for (const proposal of input.draftProposals) {
    if (proposal.lead_id) coveredLeadIds.add(proposal.lead_id);
    pipeline.push({
      key: `draft-${proposal.id}`,
      href: proposal.lead_id
        ? href(`/pipeline?leadId=${proposal.lead_id}`)
        : href(`/proposals/${proposal.id}`),
      title: proposal.client_business_name,
      nextAction: "Next: Finish proposal draft",
      badge: { label: "Draft", tone: "gray" },
      dueLabel: null,
    });
  }

  for (const lead of input.readyToPropose) {
    if (lead.stage !== "review_completed") continue;
    if (coveredLeadIds.has(lead.id)) continue;
    coveredLeadIds.add(lead.id);
    pipeline.push({
      key: `propose-${lead.id}`,
      href: href(`/pipeline?leadId=${lead.id}`),
      title: lead.business_name,
      nextAction: "Next: Create proposal",
      badge: { label: "Ready to propose", tone: "blue" },
      dueLabel: formatDueLabel(lead.next_follow_up_at, today),
      spamFlag: lead.spam_flag,
      spamReason: lead.spam_reason,
    });
  }

  for (const proposal of input.sentProposals) {
    if (proposal.lead_id) coveredLeadIds.add(proposal.lead_id);
    pipeline.push({
      key: `sent-${proposal.id}`,
      href: proposal.lead_id
        ? href(`/pipeline?leadId=${proposal.lead_id}`)
        : href(`/proposals/${proposal.id}`),
      title: proposal.client_business_name,
      nextAction: followUpAction(proposal.valid_until, today),
      badge: { label: "Proposal sent", tone: "blue" },
      dueLabel: formatDueLabel(proposal.valid_until, today),
    });
  }

  for (const lead of input.leadsDue) {
    if (!PRE_ACCEPT_STAGES.includes(lead.stage)) continue;
    if (coveredLeadIds.has(lead.id)) continue;
    coveredLeadIds.add(lead.id);
    pipeline.push({
      key: `lead-${lead.id}`,
      href: href(`/pipeline?leadId=${lead.id}`),
      title: lead.business_name,
      nextAction: pipelineLeadNextAction(lead),
      badge: pipelineLeadBadge(lead),
      dueLabel: formatDueLabel(lead.next_follow_up_at, today),
      spamFlag: lead.spam_flag,
      spamReason: lead.spam_reason,
    });
  }

  const acceptedJobs: HomeQueueItem[] = [];
  for (const proposal of input.acceptedProposals) {
    if (proposal.lead_id && customerLeadIds.has(proposal.lead_id)) continue;
    const next = acceptedJobNext(proposal, input.agreements, input.invoices, href);
    acceptedJobs.push({
      key: `accepted-${proposal.id}`,
      href: next.href,
      title: proposal.client_business_name,
      nextAction: next.action,
      badge: { label: "Accepted", tone: "green" },
      dueLabel: null,
    });
  }

  const billing: HomeQueueItem[] = input.invoices.map((invoice) => {
    const overdue = isOverdue(invoice.due_at, today) && invoice.status === "sent";
    return {
      key: `invoice-${invoice.id}`,
      href: href(`/invoices/${invoice.id}`),
      title: invoice.client_business_name,
      nextAction: invoiceNextAction(invoice, overdue),
      badge: invoiceBadge(invoice, overdue),
      dueLabel: formatDueLabel(invoice.due_at, today),
    };
  });

  const projects: HomeQueueItem[] = input.projects.map((project) => ({
    key: `project-${project.id}`,
    href: href(`/projects/${project.id}`),
    title: project.name,
    nextAction: project.next_action
      ? `Next: ${project.next_action}`
      : project.organizations?.name
        ? `Next: Open ${project.organizations.name} job`
        : "Next: Review project",
    badge: projectBadge(project.status),
    dueLabel: formatDueLabel(project.next_action_at, today),
  }));

  const calendar: HomeQueueItem[] = input.events.map((event) => ({
    key: `event-${event.id}`,
    href: href("/calendar"),
    title: event.title,
    nextAction: `Next: ${calendarEventTypeLabel(event.event_type)} appointment`,
    badge: eventBadge(event.event_type),
    dueLabel: formatEventWhen(event.starts_at),
  }));

  const openInvoiceBalance = input.invoices.reduce(
    (sum, row) => sum + invoiceBalance(row),
    0,
  );

  return {
    href,
    openInvoiceBalance,
    followUpsDueCount: input.leadsDue.filter((lead) =>
      PRE_ACCEPT_STAGES.includes(lead.stage),
    ).length,
    readyToProposeCount: input.readyToPropose.filter(
      (lead) => lead.stage === "review_completed",
    ).length,
    acceptedJobsCount: acceptedJobs.length,
    eventsCount: input.events.length,
    pipeline: pipeline.slice(0, 8),
    acceptedJobs: acceptedJobs.slice(0, 8),
    billing: billing.slice(0, 8),
    projects: projects.slice(0, 8),
    calendar: calendar.slice(0, 8),
  };
}

function acceptedJobNext(
  proposal: ProposalRow,
  agreements: AgreementLite[],
  invoices: InvoiceRow[],
  href: (path?: string) => string,
) {
  const relatedAgreements = agreements.filter(
    (agreement) =>
      agreement.proposal_id === proposal.id ||
      (proposal.lead_id != null && agreement.lead_id === proposal.lead_id),
  );
  const signed = relatedAgreements.find((row) => row.status === "signed");
  const pending = relatedAgreements.find(
    (row) => row.status === "draft" || row.status === "sent",
  );
  const relatedDeposits = invoices.filter(
    (invoice) =>
      invoice.invoice_type === "deposit" &&
      (invoice.proposal_id === proposal.id ||
        (proposal.lead_id != null && invoice.lead_id === proposal.lead_id)),
  );
  const unpaidDeposit = relatedDeposits.find(
    (invoice) => invoice.status === "draft" || invoice.status === "sent",
  );

  if (!signed && !pending) {
    return {
      action: "Next: Create agreement",
      href: href(`/proposals/${proposal.id}`),
    };
  }
  if (!signed && pending) {
    return {
      action:
        pending.status === "sent"
          ? "Next: Get agreement signed"
          : "Next: Send agreement for signature",
      href: href(`/agreements/${pending.id}`),
    };
  }
  if (unpaidDeposit) {
    return {
      action:
        unpaidDeposit.status === "draft"
          ? "Next: Send deposit invoice"
          : "Next: Collect deposit",
      href: href(`/invoices/${unpaidDeposit.id}`),
    };
  }
  if (signed) {
    return {
      action: "Next: Send deposit invoice",
      href: href(`/agreements/${signed.id}`),
    };
  }
  return {
    action: "Next: Schedule kickoff",
    href: href(`/proposals/${proposal.id}`),
  };
}

function pipelineLeadNextAction(lead: LeadRow) {
  switch (lead.stage) {
    case "new_inquiry":
      return "Next: Call or email the lead";
    case "follow_up":
      return "Next: Follow up today";
    case "review_booked":
      return "Next: Prepare for estimate visit";
    case "review_completed":
      return "Next: Create proposal";
    case "proposal_sent":
      return "Next: Follow up on proposal";
    default:
      return `Next: Advance ${leadStageLabel(lead.stage).toLowerCase()}`;
  }
}

function pipelineLeadBadge(lead: LeadRow): HomeQueueItem["badge"] {
  switch (lead.stage) {
    case "new_inquiry":
      return { label: "New lead", tone: "gray" };
    case "follow_up":
      return { label: "Needs follow-up", tone: "orange" };
    case "review_booked":
      return { label: "Estimate scheduled", tone: "blue" };
    case "review_completed":
      return { label: "Ready to propose", tone: "blue" };
    case "proposal_sent":
      return { label: "Proposal sent", tone: "blue" };
    default:
      return { label: leadStageLabel(lead.stage), tone: "gray" };
  }
}

function invoiceNextAction(invoice: InvoiceRow, overdue: boolean) {
  const amount = formatMoney(invoiceBalance(invoice));
  if (overdue) return `Next: Collect overdue ${amount}`;
  if (invoice.status === "draft" && invoice.invoice_type === "deposit") {
    return "Next: Send deposit invoice";
  }
  if (invoice.status === "draft") return "Next: Send invoice";
  if (invoice.invoice_type === "deposit") return `Next: Collect deposit (${amount})`;
  return `Next: Collect payment (${amount})`;
}

function invoiceBadge(
  invoice: InvoiceRow,
  overdue: boolean,
): HomeQueueItem["badge"] {
  if (overdue) return { label: "Overdue", tone: "red" };
  if (invoice.status === "draft" && invoice.invoice_type === "deposit") {
    return { label: "Deposit draft", tone: "gray" };
  }
  if (invoice.status === "sent" && invoice.invoice_type === "deposit") {
    return { label: "Deposit due", tone: "orange" };
  }
  if (invoice.status === "sent") return { label: "Payment due", tone: "orange" };
  if (invoice.status === "draft") return { label: "Draft invoice", tone: "gray" };
  return { label: invoice.status, tone: "gray" };
}

function projectBadge(status: string): HomeQueueItem["badge"] {
  switch (status) {
    case "planning":
      return { label: "Planning", tone: "purple" };
    case "active":
      return { label: "Active", tone: "darkGreen" };
    case "on_hold":
      return { label: "On hold", tone: "orange" };
    case "completed":
      return { label: "Completed", tone: "green" };
    default:
      return { label: status.replaceAll("_", " "), tone: "gray" };
  }
}

function eventBadge(eventType: string): HomeQueueItem["badge"] {
  switch (eventType) {
    case "consult":
      return { label: "Estimate", tone: "blue" };
    case "onsite":
      return { label: "Install / onsite", tone: "darkGreen" };
    case "call":
      return { label: "Call", tone: "gray" };
    case "follow_up":
      return { label: "Follow-up", tone: "orange" };
    default:
      return { label: calendarEventTypeLabel(eventType), tone: "gray" };
  }
}

function followUpAction(validUntil: string | null, today: string) {
  if (!validUntil) return "Next: Follow up on proposal";
  if (validUntil < today) return "Next: Follow up — proposal may be stale";
  return `Next: Follow up before ${formatShortDate(validUntil)}`;
}

function isOverdue(dueAt: string | null, today: string) {
  return Boolean(dueAt && dueAt < today);
}

export function formatDueLabel(value: string | null | undefined, today: string) {
  if (!value) return null;
  const dateOnly = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return formatShortDate(value);
  if (dateOnly === today) return "Due today";
  const tomorrow = addDays(today, 1);
  if (dateOnly === tomorrow) return "Due tomorrow";
  if (dateOnly < today) return `Overdue ${formatShortDate(dateOnly)}`;
  return `Due ${formatShortDate(dateOnly)}`;
}

function formatEventWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value: string) {
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function addDays(dateOnly: string, days: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayDateOnly() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
