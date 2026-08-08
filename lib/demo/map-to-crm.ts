import type { ActivityRow } from "@/lib/activities";
import type { AgreementRow, AgreementItemRow, AgreementWithItems } from "@/lib/agreements";
import type { CalendarEventRow, CalendarEventType } from "@/lib/calendar";
import {
  mapOrganizationToCrmRow,
  type CrmTableRow,
  type OrganizationRow,
} from "@/lib/crm";
import type { InvoiceRow, InvoiceItemRow, InvoiceWithItems } from "@/lib/invoices";
import type { LeadRow, LeadSource, LeadStage } from "@/lib/leads";
import type {
  ProposalItemRow,
  ProposalStatus,
  ProposalWithItems,
} from "@/lib/proposals";
import type {
  ProjectStatus,
  ProjectWithOrganization,
} from "@/lib/projects";
import type { PurchaseType, PurchaseWithRelations } from "@/lib/purchases";
import type { ToolRow, ToolStatus } from "@/lib/tools";
import type { DemoDoc, DemoSeed } from "@/lib/demo/types";
import { normalizeDemoSeed } from "@/lib/demo/data";

function stamp(iso?: string | null) {
  return iso ?? new Date().toISOString();
}

function dateOnly(iso?: string | null) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

function proposalItemsForDoc(doc: DemoDoc): ProposalItemRow[] {
  const labor = Math.round(doc.total * 0.65 * 100) / 100;
  const materials = Math.round((doc.total - labor) * 100) / 100;
  const created_at = stamp(doc.issuedAt);
  return [
    {
      id: `${doc.id}-item-1`,
      proposal_id: doc.id,
      description: "Labor / services",
      quantity: 1,
      unit_price: labor,
      line_total: labor,
      sort_order: 0,
      created_at,
    },
    {
      id: `${doc.id}-item-2`,
      proposal_id: doc.id,
      description: "Materials / equipment",
      quantity: 1,
      unit_price: materials,
      line_total: materials,
      sort_order: 1,
      created_at,
    },
  ];
}

function agreementItemsForDoc(doc: DemoDoc): AgreementItemRow[] {
  const labor = Math.round(doc.total * 0.65 * 100) / 100;
  const materials = Math.round((doc.total - labor) * 100) / 100;
  const created_at = stamp(doc.issuedAt);
  return [
    {
      id: `${doc.id}-item-1`,
      agreement_id: doc.id,
      description: "Labor / services",
      quantity: 1,
      unit_price: labor,
      line_total: labor,
      sort_order: 0,
      created_at,
    },
    {
      id: `${doc.id}-item-2`,
      agreement_id: doc.id,
      description: "Materials / equipment",
      quantity: 1,
      unit_price: materials,
      line_total: materials,
      sort_order: 1,
      created_at,
    },
  ];
}

function invoiceItemsForDoc(doc: DemoDoc): InvoiceItemRow[] {
  const created_at = stamp(doc.issuedAt);
  return [
    {
      id: `${doc.id}-item-1`,
      invoice_id: doc.id,
      description: doc.title,
      quantity: 1,
      unit_price: doc.total,
      line_total: doc.total,
      sort_order: 0,
      created_at,
    },
  ];
}

function scopeForDoc(doc: DemoDoc, industry: string) {
  return `This proposal covers the ${industry || "service"} work outlined for ${doc.businessName}: ${doc.title}. Scope includes on-site assessment, agreed deliverables, and a customer walkthrough at completion. Changes outside this scope may adjust timeline and investment.`;
}

function termsForDoc() {
  return [
    "Payment: 30% deposit to schedule the work, with the balance due on completion unless otherwise agreed in writing.",
    "Schedule: Work dates are confirmed after the deposit clears. Weather, site access, and material lead times may affect timing.",
    "Changes: Material changes to scope will be quoted and approved before additional work proceeds.",
    "Warranty: Workmanship is warranted for 90 days from completion unless a different term is noted above.",
  ].join("\n\n");
}

function asLeadSource(value: string): LeadSource {
  if (
    value === "website_form" ||
    value === "referral" ||
    value === "manual" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}

function asEventType(value: string): CalendarEventType {
  if (
    value === "consult" ||
    value === "onsite" ||
    value === "call" ||
    value === "follow_up" ||
    value === "other"
  ) {
    return value;
  }
  if (value.includes("consult")) return "consult";
  if (value.includes("call")) return "call";
  if (value.includes("follow")) return "follow_up";
  return "onsite";
}

function asPurchaseType(value: string): PurchaseType {
  if (
    value === "promo" ||
    value === "equipment" ||
    value === "supplies" ||
    value === "other"
  ) {
    return value;
  }
  if (value === "materials") return "equipment";
  if (value === "ops") return "other";
  return "supplies";
}

function asToolStatus(value: string): ToolStatus {
  if (
    value === "active" ||
    value === "trial" ||
    value === "inactive" ||
    value === "cancelled" ||
    value === "replacing"
  ) {
    return value;
  }
  if (value === "evaluating") return "trial";
  if (value === "retired") return "inactive";
  return "active";
}

function asProposalStatus(value: string): ProposalStatus {
  const v = value.toLowerCase();
  if (
    v === "draft" ||
    v === "sent" ||
    v === "accepted" ||
    v === "declined" ||
    v === "expired"
  ) {
    return v;
  }
  return "draft";
}

function orgIdForCustomer(seed: DemoSeed, businessName: string) {
  const lead = seed.leads.find((row) => row.businessName === businessName);
  return lead ? `org-${lead.id}` : `org-${businessName.toLowerCase().replace(/\s+/g, "-")}`;
}

function leadIdForCustomer(seed: DemoSeed, businessName: string) {
  return seed.leads.find((row) => row.businessName === businessName)?.id ?? null;
}

/** Map session seed JSON into the same domain shapes the live CRM UI expects. */
export function mapDemoSeedToCrm(raw: DemoSeed) {
  const seed = normalizeDemoSeed(raw);
  const now = new Date().toISOString();

  const organizations: OrganizationRow[] = seed.leads.map((lead) => ({
    id: `org-${lead.id}`,
    name: lead.businessName,
    category: seed.business.category || null,
    website: null,
    email: lead.email,
    phone: lead.phone,
    city: seed.business.location.split(",")[0]?.trim() || null,
    state:
      seed.business.location.split(",")[1]?.trim().slice(0, 2).toUpperCase() ||
      "MA",
    status: "active" as const,
    notes: lead.message,
    organization_relationships: [
      {
        id: `rel-${lead.id}`,
        relationship_type: "customer" as const,
        lifecycle_stage: lead.stage,
      },
    ],
    organization_contacts: [
      {
        id: `oc-${lead.id}`,
        title: "Primary",
        is_primary: true,
        contact_id: `contact-${lead.id}`,
        contacts: {
          id: `contact-${lead.id}`,
          first_name: lead.contactName.split(" ")[0] ?? lead.contactName,
          last_name: lead.contactName.split(" ").slice(1).join(" ") || null,
          display_name: lead.contactName,
          email: lead.email,
          phone: lead.phone,
        },
      },
    ],
  }));

  const businessRows: CrmTableRow[] = organizations.map(mapOrganizationToCrmRow);

  const leads: LeadRow[] = seed.leads.map((lead) => ({
    id: lead.id,
    organization_id: `org-${lead.id}`,
    contact_id: `contact-${lead.id}`,
    business_name: lead.businessName,
    contact_name: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    title: "",
    source: asLeadSource(lead.source),
    stage: lead.stage as LeadStage,
    message: lead.message,
    notes: null,
    next_follow_up_at: lead.nextFollowUpAt,
    lost_reason: null,
    created_at: stamp(),
    updated_at: stamp(),
  }));

  const industry = seed.business.category || "service";
  const defaultTerms = termsForDoc();

  const proposals: ProposalWithItems[] = seed.proposals.map((doc) => ({
    id: doc.id,
    proposal_number: doc.number,
    title: doc.title,
    status: asProposalStatus(doc.status),
    lead_id: leadIdForCustomer(seed, doc.businessName),
    organization_id: orgIdForCustomer(seed, doc.businessName),
    client_business_name: doc.businessName,
    client_contact_name:
      seed.leads.find((l) => l.businessName === doc.businessName)
        ?.contactName ?? null,
    client_email:
      seed.leads.find((l) => l.businessName === doc.businessName)?.email ??
      null,
    client_phone:
      seed.leads.find((l) => l.businessName === doc.businessName)?.phone ??
      null,
    issued_at: dateOnly(doc.issuedAt),
    valid_until: null,
    scope_summary: scopeForDoc(doc, industry),
    terms: defaultTerms,
    notes: null,
    deposit_percent: 30,
    subtotal: doc.total,
    total_amount: doc.total,
    sent_at: doc.status.toLowerCase() === "sent" ? stamp(doc.issuedAt) : null,
    accepted_at: null,
    share_token: null,
    client_response: null,
    client_responded_at: null,
    declined_at: null,
    created_at: stamp(doc.issuedAt),
    updated_at: stamp(doc.issuedAt),
    proposal_items: proposalItemsForDoc(doc),
  }));

  const agreements: AgreementWithItems[] = seed.agreements.map((doc) => ({
    id: doc.id,
    agreement_number: doc.number,
    title: doc.title,
    status: (["draft", "sent", "signed", "void"].includes(
      doc.status.toLowerCase(),
    )
      ? doc.status.toLowerCase()
      : "draft") as AgreementRow["status"],
    proposal_id: seed.proposals.find((p) => p.businessName === doc.businessName)
      ?.id ?? null,
    lead_id: leadIdForCustomer(seed, doc.businessName),
    organization_id: orgIdForCustomer(seed, doc.businessName),
    client_business_name: doc.businessName,
    client_contact_name:
      seed.leads.find((l) => l.businessName === doc.businessName)
        ?.contactName ?? null,
    client_email:
      seed.leads.find((l) => l.businessName === doc.businessName)?.email ??
      null,
    client_phone:
      seed.leads.find((l) => l.businessName === doc.businessName)?.phone ??
      null,
    issued_at: dateOnly(doc.issuedAt),
    scope_summary: scopeForDoc(doc, industry),
    terms: defaultTerms,
    notes: null,
    deposit_percent: 30,
    subtotal: doc.total,
    total_amount: doc.total,
    signer_name:
      doc.status.toLowerCase() === "signed"
        ? seed.leads.find((l) => l.businessName === doc.businessName)
            ?.contactName ?? null
        : null,
    signed_at:
      doc.status.toLowerCase() === "signed" ? stamp(doc.issuedAt) : null,
    sent_at: stamp(doc.issuedAt),
    share_token: null,
    created_at: stamp(doc.issuedAt),
    updated_at: stamp(doc.issuedAt),
    agreement_items: agreementItemsForDoc(doc),
  }));

  const invoices: InvoiceWithItems[] = seed.invoices.map((doc) => ({
    id: doc.id,
    invoice_number: doc.number,
    title: doc.title,
    invoice_type: "deposit" as const,
    status: (["draft", "sent", "paid", "void"].includes(doc.status.toLowerCase())
      ? doc.status.toLowerCase()
      : "sent") as InvoiceRow["status"],
    agreement_id:
      seed.agreements.find((a) => a.businessName === doc.businessName)?.id ??
      null,
    proposal_id:
      seed.proposals.find((p) => p.businessName === doc.businessName)?.id ??
      null,
    lead_id: leadIdForCustomer(seed, doc.businessName),
    organization_id: orgIdForCustomer(seed, doc.businessName),
    project_id:
      seed.projects.find((p) => p.businessName === doc.businessName)?.id ?? null,
    client_business_name: doc.businessName,
    client_contact_name:
      seed.leads.find((l) => l.businessName === doc.businessName)
        ?.contactName ?? null,
    client_email:
      seed.leads.find((l) => l.businessName === doc.businessName)?.email ??
      null,
    client_phone:
      seed.leads.find((l) => l.businessName === doc.businessName)?.phone ??
      null,
    issued_at: dateOnly(doc.issuedAt),
    due_at: dateOnly(doc.issuedAt),
    notes: null,
    subtotal: doc.total,
    total_amount: doc.total,
    amount_paid: doc.status.toLowerCase() === "paid" ? doc.total : 0,
    sent_at: stamp(doc.issuedAt),
    paid_at: doc.status.toLowerCase() === "paid" ? stamp(doc.issuedAt) : null,
    created_at: stamp(doc.issuedAt),
    updated_at: stamp(doc.issuedAt),
    invoice_items: invoiceItemsForDoc(doc),
  }));

  const projects: ProjectWithOrganization[] = seed.projects.map((project) => {
    const orgId = orgIdForCustomer(seed, project.businessName);
    return {
      id: project.id,
      organization_id: orgId,
      lead_id: leadIdForCustomer(seed, project.businessName),
      name: project.name,
      status: project.status as ProjectStatus,
      priority: "normal",
      started_at: project.startDate ?? null,
      target_end_at: project.targetDate ?? null,
      next_action: project.nextAction,
      next_action_at: null,
      scope: project.scope ?? project.nextAction,
      notes: null,
      created_at: now,
      updated_at: now,
      organizations: { id: orgId, name: project.businessName },
      open_task_count: 0,
      next_action_source: null,
    } satisfies ProjectWithOrganization;
  });

  const events: CalendarEventRow[] = seed.events.map((event) => ({
    id: event.id,
    organization_id: orgIdForCustomer(seed, event.businessName),
    lead_id: leadIdForCustomer(seed, event.businessName),
    project_id:
      seed.projects.find((p) => p.businessName === event.businessName)?.id ??
      null,
    title: event.title,
    event_type: asEventType(event.eventType),
    starts_at: event.startsAt,
    ends_at: null,
    location: null,
    notes: null,
    created_at: now,
    updated_at: now,
  }));

  const purchases: PurchaseWithRelations[] = seed.purchases.map((row) => {
    const orgId =
      row.businessName === seed.business.name
        ? null
        : orgIdForCustomer(seed, row.businessName);
    const project = seed.projects.find(
      (p) => p.businessName === row.businessName,
    );
    return {
      id: row.id,
      name: row.description,
      purchase_type: asPurchaseType(row.purchaseType),
      amount: row.amount,
      purchased_at: dateOnly(row.purchasedAt),
      quantity: 1,
      organization_id: orgId,
      project_id: project?.id ?? null,
      notes: `Vendor: ${row.vendor}`,
      created_at: stamp(row.purchasedAt),
      updated_at: stamp(row.purchasedAt),
      organizations: orgId
        ? { id: orgId, name: row.businessName }
        : null,
      projects: project ? { id: project.id, name: project.name } : null,
    };
  });

  const tools: ToolRow[] = seed.tools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    category: tool.category,
    website: null,
    admin_url: null,
    account_email: seed.business.email,
    plan: null,
    billing_amount: tool.monthlyCost,
    billing_cadence: tool.monthlyCost > 0 ? "monthly" : "free",
    renewal_date: null,
    status: asToolStatus(tool.status),
    notes: tool.notes,
    created_at: now,
    updated_at: now,
  }));

  const activities: ActivityRow[] = seed.activities.map((activity) => ({
    id: activity.id,
    lead_id: seed.leads[0]?.id ?? null,
    organization_id: null,
    project_id: null,
    activity_type: activity.kind === "email" ? "email" : "note",
    email_direction: activity.kind === "email" ? "sent" : null,
    email_address: activity.kind === "email" ? seed.business.email : null,
    subject: activity.summary,
    body: null,
    occurred_at: activity.occurredAt,
    created_at: activity.occurredAt,
    updated_at: activity.occurredAt,
  }));

  const activitiesByLeadId = activities.reduce<Record<string, ActivityRow[]>>(
    (acc, activity) => {
      if (!activity.lead_id) return acc;
      acc[activity.lead_id] = acc[activity.lead_id] ?? [];
      acc[activity.lead_id].push(activity);
      return acc;
    },
    {},
  );

  const eventsByLeadId = events.reduce<Record<string, CalendarEventRow[]>>(
    (acc, event) => {
      if (!event.lead_id) return acc;
      acc[event.lead_id] = acc[event.lead_id] ?? [];
      acc[event.lead_id].push(event);
      return acc;
    },
    {},
  );

  return {
    seed,
    organizations,
    businessRows,
    leads,
    proposals,
    agreements,
    invoices,
    projects,
    events,
    purchases,
    tools,
    activities,
    activitiesByLeadId,
    eventsByLeadId,
  };
}

export type DemoCrmData = ReturnType<typeof mapDemoSeedToCrm>;

export function findDemoOrganization(data: DemoCrmData, id: string) {
  return data.organizations.find((org) => org.id === id) ?? null;
}

export function findDemoProject(data: DemoCrmData, id: string) {
  return data.projects.find((project) => project.id === id) ?? null;
}

export function findDemoProposal(data: DemoCrmData, id: string) {
  return data.proposals.find((row) => row.id === id) ?? null;
}

export function findDemoAgreement(data: DemoCrmData, id: string) {
  return data.agreements.find((row) => row.id === id) ?? null;
}

export function findDemoInvoice(data: DemoCrmData, id: string) {
  return data.invoices.find((row) => row.id === id) ?? null;
}

export function demoOrganizationBundle(data: DemoCrmData, id: string) {
  const org = findDemoOrganization(data, id);
  if (!org) return null;

  const organization = mapOrganizationToCrmRow(org);
  const leads = data.leads.filter((lead) => lead.organization_id === id);
  const leadIds = new Set(leads.map((lead) => lead.id));
  const projects = data.projects.filter(
    (project) => project.organization_id === id,
  );
  const projectIds = new Set(projects.map((project) => project.id));

  const matchesOrg = (organizationId: string | null, leadId: string | null) =>
    organizationId === id || (leadId !== null && leadIds.has(leadId));

  const proposals = data.proposals.filter((row) =>
    matchesOrg(row.organization_id, row.lead_id),
  );

  const agreements = data.agreements.filter((row) =>
    matchesOrg(row.organization_id, row.lead_id),
  );

  const invoices = data.invoices.filter((row) =>
    matchesOrg(row.organization_id, row.lead_id),
  );

  const purchases = data.purchases.filter(
    (row) =>
      row.organization_id === id ||
      (row.project_id !== null && projectIds.has(row.project_id)),
  );

  const activities = data.activities.filter(
    (row) =>
      row.organization_id === id ||
      (row.lead_id !== null && leadIds.has(row.lead_id)),
  );

  return {
    organization,
    leads,
    projects,
    proposals,
    agreements,
    invoices,
    purchases,
    activities,
  };
}
