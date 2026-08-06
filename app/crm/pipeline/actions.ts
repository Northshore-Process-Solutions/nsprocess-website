"use server";

import { revalidatePath } from "next/cache";

import {
  LEAD_SOURCES,
  LEAD_STAGES,
  defaultNextFollowUpDate,
  isCustomerStage,
  type LeadSource,
  type LeadStage,
} from "@/lib/leads";
import { sendAppEmail } from "@/lib/mail";
import { normalizeUsPhone } from "@/lib/phone";
import { defaultProjectName } from "@/lib/projects";
import { contact } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/server";

export type LeadInput = {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  title?: string;
  source: LeadSource;
  stage: LeadStage;
  message?: string;
  notes?: string;
  nextFollowUpAt?: string;
  lostReason?: string;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
  organizationId?: string;
  projectId?: string;
  alreadyLinked?: boolean;
};

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parsePhone(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { phone: null as string | null };

  const normalized = normalizeUsPhone(trimmed);
  if (!normalized) {
    return { error: "Phone must be a valid 10-digit US number." };
  }

  return { phone: normalized };
}

function parseInput(input: LeadInput): LeadInput | ActionResult {
  const businessName = input.businessName.trim();
  const contactName = input.contactName.trim();
  const email = input.email.trim().toLowerCase();
  const title = clean(input.title) ?? "Free Process Review";

  if (!businessName) {
    return { ok: false, error: "Business name is required." };
  }
  if (!contactName) {
    return { ok: false, error: "Contact name is required." };
  }
  if (!email) {
    return { ok: false, error: "Email is required." };
  }
  if (!LEAD_SOURCES.some((item) => item.value === input.source)) {
    return { ok: false, error: "Invalid source." };
  }
  if (!LEAD_STAGES.some((item) => item.value === input.stage)) {
    return { ok: false, error: "Invalid stage." };
  }

  const phoneResult = parsePhone(input.phone);
  if (phoneResult.error) {
    return { ok: false, error: phoneResult.error };
  }

  if (input.stage === "lost" && !clean(input.lostReason)) {
    return { ok: false, error: "Lost reason is required when stage is Lost." };
  }

  return {
    businessName,
    contactName,
    email,
    phone: phoneResult.phone ?? undefined,
    title,
    source: input.source,
    stage: input.stage,
    message: clean(input.message) ?? undefined,
    notes: clean(input.notes) ?? undefined,
    nextFollowUpAt: clean(input.nextFollowUpAt) ?? undefined,
    lostReason:
      input.stage === "lost" ? clean(input.lostReason) ?? undefined : undefined,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

function toDbPayload(input: LeadInput) {
  return {
    business_name: input.businessName,
    contact_name: input.contactName,
    email: input.email,
    phone: input.phone ?? null,
    title: input.title ?? "Free Process Review",
    source: input.source,
    stage: input.stage,
    message: input.message ?? null,
    notes: input.notes ?? null,
    next_follow_up_at: input.nextFollowUpAt ?? null,
    lost_reason: input.stage === "lost" ? (input.lostReason ?? null) : null,
  };
}

function splitContactName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: null as string | null, lastName: null as string | null };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null as string | null };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function buildCustomerNotes(lead: {
  notes: string | null;
  message: string | null;
  title: string;
}) {
  const parts = [
    `Converted from Process Review pipeline (${lead.title}).`,
    lead.message ? `Original inquiry: ${lead.message}` : null,
    lead.notes,
  ].filter(Boolean);

  return parts.join("\n\n");
}

async function ensureCustomerRelationship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
) {
  const { data: existing, error: lookupError } = await supabase
    .from("organization_relationships")
    .select("id, relationship_type")
    .eq("organization_id", organizationId);

  if (lookupError) {
    return { error: lookupError.message };
  }

  const customer = (existing ?? []).find(
    (row) => row.relationship_type === "customer",
  );

  if (customer) {
    const { error } = await supabase
      .from("organization_relationships")
      .update({ lifecycle_stage: "active" })
      .eq("id", customer.id);

    return { error: error?.message ?? null };
  }

  // Replace other single-type relationships with customer for this org.
  if ((existing ?? []).length > 0) {
    const { error: deleteError } = await supabase
      .from("organization_relationships")
      .delete()
      .eq("organization_id", organizationId);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  const { error } = await supabase.from("organization_relationships").insert({
    organization_id: organizationId,
    relationship_type: "customer",
    lifecycle_stage: "active",
  });

  return { error: error?.message ?? null };
}

async function findExistingOrganizationId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lead: {
    business_name: string;
    email: string;
  },
) {
  const { data: byEmail } = await supabase
    .from("organizations")
    .select("id")
    .ilike("email", lead.email)
    .limit(1)
    .maybeSingle();

  if (byEmail?.id) return byEmail.id;

  const { data: byName } = await supabase
    .from("organizations")
    .select("id")
    .ilike("name", lead.business_name)
    .limit(1)
    .maybeSingle();

  if (byName?.id) return byName.id;

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .ilike("email", lead.email)
    .limit(1)
    .maybeSingle();

  if (!contact?.id) return null;

  const { data: link } = await supabase
    .from("organization_contacts")
    .select("organization_id")
    .eq("contact_id", contact.id)
    .limit(1)
    .maybeSingle();

  return link?.organization_id ?? null;
}

async function upsertPrimaryContactForOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  input: {
    contactName: string;
    email: string;
    phone: string | null;
    existingContactId?: string | null;
  },
) {
  const { firstName, lastName } = splitContactName(input.contactName);
  let contactId = input.existingContactId ?? null;

  if (!contactId) {
    const { data: byEmail } = await supabase
      .from("contacts")
      .select("id")
      .ilike("email", input.email)
      .limit(1)
      .maybeSingle();
    contactId = byEmail?.id ?? null;
  }

  if (contactId) {
    const { error } = await supabase
      .from("contacts")
      .update({
        first_name: firstName,
        last_name: lastName,
        email: input.email,
        phone: input.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (error) return { error: error.message, contactId: null };
  } else {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: input.email,
        phone: input.phone,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        error: error?.message ?? "Failed to create contact.",
        contactId: null,
      };
    }

    contactId = data.id;
  }

  const { data: existingLink, error: linkLookupError } = await supabase
    .from("organization_contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (linkLookupError) {
    return { error: linkLookupError.message, contactId: null };
  }

  if (existingLink) {
    const { error } = await supabase
      .from("organization_contacts")
      .update({ is_primary: true })
      .eq("id", existingLink.id);

    if (error) return { error: error.message, contactId: null };
  } else {
    await supabase
      .from("organization_contacts")
      .update({ is_primary: false })
      .eq("organization_id", organizationId);

    const { error } = await supabase.from("organization_contacts").insert({
      organization_id: organizationId,
      contact_id: contactId,
      is_primary: true,
    });

    if (error) return { error: error.message, contactId: null };
  }

  return { error: null, contactId };
}

async function ensureProjectForCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    organizationId: string;
    leadId: string;
    businessName: string;
  },
) {
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("lead_id", input.leadId)
    .maybeSingle();

  if (existing?.id) {
    return { error: null as string | null, projectId: existing.id as string };
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: input.organizationId,
      lead_id: input.leadId,
      name: defaultProjectName(input.businessName),
      status: "active",
      started_at: new Date().toISOString().slice(0, 10),
      notes: "Created when deposit was received / project kicked off.",
    })
    .select("id")
    .single();

  if (error || !project) {
    return {
      error: error?.message ?? "Failed to create project.",
      projectId: null as string | null,
    };
  }

  return { error: null as string | null, projectId: project.id as string };
}

async function attachLeadHistoryToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    projectId: string;
    organizationId: string;
    leadId: string;
  },
) {
  const now = new Date().toISOString();

  await supabase
    .from("activities")
    .update({
      project_id: input.projectId,
      organization_id: input.organizationId,
      updated_at: now,
    })
    .eq("lead_id", input.leadId)
    .is("project_id", null);

  await supabase
    .from("calendar_events")
    .update({
      project_id: input.projectId,
      organization_id: input.organizationId,
      updated_at: now,
    })
    .eq("lead_id", input.leadId)
    .is("project_id", null);
}

export async function convertWonLeadToCrm(
  leadId: string,
  targetStage: LeadStage = "won",
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Missing lead id." };

  const nextStage: LeadStage = isCustomerStage(targetStage)
    ? targetStage
    : "won";

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { ok: false, error: leadError?.message ?? "Lead not found." };
  }

  if (lead.organization_id) {
    const relationshipResult = await ensureCustomerRelationship(
      supabase,
      lead.organization_id,
    );
    if (relationshipResult.error) {
      return { ok: false, error: relationshipResult.error };
    }

    const { error } = await supabase
      .from("leads")
      .update({
        stage: nextStage,
        lost_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    await supabase
      .from("activities")
      .update({
        organization_id: lead.organization_id,
        updated_at: new Date().toISOString(),
      })
      .eq("lead_id", leadId)
      .is("organization_id", null);

    const projectResult = await ensureProjectForCustomer(supabase, {
      organizationId: lead.organization_id,
      leadId,
      businessName: lead.business_name,
    });
    if (projectResult.error || !projectResult.projectId) {
      return {
        ok: false,
        error: projectResult.error ?? "Failed to create project.",
      };
    }

    await attachLeadHistoryToProject(supabase, {
      projectId: projectResult.projectId,
      organizationId: lead.organization_id,
      leadId,
    });

    revalidatePath("/crm/pipeline");
    revalidatePath("/crm");
    revalidatePath("/crm/projects");
    revalidatePath("/crm/calendar");
    revalidatePath(`/crm/organizations/${lead.organization_id}`);
    revalidatePath(`/crm/projects/${projectResult.projectId}`);
    return {
      ok: true,
      organizationId: lead.organization_id,
      projectId: projectResult.projectId,
      alreadyLinked: true,
    };
  }

  let organizationId = await findExistingOrganizationId(supabase, {
    business_name: lead.business_name,
    email: lead.email,
  });

  if (organizationId) {
    const { error } = await supabase
      .from("organizations")
      .update({
        status: "active",
        email: lead.email,
        phone: lead.phone,
        notes: buildCustomerNotes(lead),
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId);

    if (error) return { ok: false, error: error.message };
  } else {
    const { data: organization, error } = await supabase
      .from("organizations")
      .insert({
        name: lead.business_name,
        email: lead.email,
        phone: lead.phone,
        status: "active",
        notes: buildCustomerNotes(lead),
      })
      .select("id")
      .single();

    if (error || !organization) {
      return {
        ok: false,
        error: error?.message ?? "Failed to create business.",
      };
    }

    organizationId = organization.id;
  }

  const relationshipResult = await ensureCustomerRelationship(
    supabase,
    organizationId,
  );
  if (relationshipResult.error) {
    return { ok: false, error: relationshipResult.error };
  }

  const contactResult = await upsertPrimaryContactForOrg(
    supabase,
    organizationId,
    {
      contactName: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      existingContactId: lead.contact_id,
    },
  );
  if (contactResult.error || !contactResult.contactId) {
    return {
      ok: false,
      error: contactResult.error ?? "Failed to link contact.",
    };
  }

  const { error } = await supabase
    .from("leads")
    .update({
      organization_id: organizationId,
      contact_id: contactResult.contactId,
      stage: nextStage,
      lost_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  // Keep activity history attached when the lead becomes a CRM customer.
  await supabase
    .from("activities")
    .update({
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    })
    .eq("lead_id", leadId)
    .is("organization_id", null);

  const projectResult = await ensureProjectForCustomer(supabase, {
    organizationId,
    leadId,
    businessName: lead.business_name,
  });
  if (projectResult.error || !projectResult.projectId) {
    return {
      ok: false,
      error: projectResult.error ?? "Failed to create project.",
    };
  }

  await attachLeadHistoryToProject(supabase, {
    projectId: projectResult.projectId,
    organizationId,
    leadId,
  });

  revalidatePath("/crm/pipeline");
  revalidatePath("/crm");
  revalidatePath("/crm/projects");
  revalidatePath("/crm/calendar");
  revalidatePath(`/crm/organizations/${organizationId}`);
  revalidatePath(`/crm/projects/${projectResult.projectId}`);
  return {
    ok: true,
    organizationId,
    projectId: projectResult.projectId,
  };
}

export async function createLead(input: LeadInput): Promise<ActionResult> {
  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const payload = toDbPayload({
    ...parsed,
    nextFollowUpAt: parsed.nextFollowUpAt ?? defaultNextFollowUpDate(),
  });

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create lead." };
  }

  if (isCustomerStage(parsed.stage)) {
    return convertWonLeadToCrm(data.id, parsed.stage);
  }

  revalidatePath("/crm/pipeline");
  return { ok: true };
}

export async function updateLead(
  leadId: string,
  input: LeadInput,
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Missing lead id." };

  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("leads")
    .update({
      ...toDbPayload(parsed),
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  if (isCustomerStage(parsed.stage)) {
    return convertWonLeadToCrm(leadId, parsed.stage);
  }

  revalidatePath("/crm/pipeline");
  return { ok: true };
}

export async function updateLeadStage(
  leadId: string,
  stage: LeadStage,
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Missing lead id." };
  if (!LEAD_STAGES.some((item) => item.value === stage)) {
    return { ok: false, error: "Invalid stage." };
  }

  if (isCustomerStage(stage)) {
    return convertWonLeadToCrm(leadId, stage);
  }

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("leads")
    .update({
      stage,
      lost_reason: stage === "lost" ? undefined : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/crm/pipeline");
  return { ok: true };
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Missing lead id." };

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/crm/pipeline");
  return { ok: true };
}

export async function replyToLead(
  leadId: string,
  input: { subject: string; body: string; projectId?: string | null },
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Missing lead id." };

  const subject = clean(input.subject);
  const body = clean(input.body);

  if (!subject) return { ok: false, error: "Subject is required." };
  if (!body) return { ok: false, error: "Message body is required." };

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, email, contact_name, business_name, organization_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    return { ok: false, error: leadError?.message ?? "Lead not found." };
  }

  const to = clean(lead.email);
  if (!to) return { ok: false, error: "Lead does not have an email address." };

  let projectId = clean(input.projectId);
  if (!projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("lead_id", leadId)
      .maybeSingle();
    projectId = project?.id ?? null;
  }

  const mailResult = await sendAppEmail({
    to,
    subject,
    text: body,
    replyTo: contact.email,
  });

  if (!mailResult.ok) {
    return { ok: false, error: mailResult.error };
  }

  const { error: activityError } = await supabase.from("activities").insert({
    lead_id: lead.id,
    organization_id: lead.organization_id,
    project_id: projectId,
    activity_type: "email",
    email_direction: "sent",
    subject,
    body,
    occurred_at: new Date().toISOString(),
  });

  if (activityError) {
    return {
      ok: false,
      error: `Email sent, but failed to log activity: ${activityError.message}`,
    };
  }

  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/projects");
  if (lead.organization_id) {
    revalidatePath(`/crm/organizations/${lead.organization_id}`);
  }
  if (projectId) {
    revalidatePath(`/crm/projects/${projectId}`);
  }

  return { ok: true };
}
