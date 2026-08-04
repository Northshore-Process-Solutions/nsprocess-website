"use server";

import { revalidatePath } from "next/cache";

import {
  ORGANIZATION_STATUSES,
  RELATIONSHIP_TYPES,
  type OrganizationStatus,
  type RelationshipType,
} from "@/lib/crm";
import { normalizeUsPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

export type OrganizationInput = {
  name: string;
  relationshipType: RelationshipType;
  status: OrganizationStatus;
  category?: string;
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  notes?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTitle?: string;
  contactId?: string | null;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
};

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parsePhoneField(
  value: string | undefined,
  label: string,
): { phone?: string; error?: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { phone: undefined };
  }

  const normalized = normalizeUsPhone(trimmed);
  if (!normalized) {
    return {
      error: `${label} must be a valid 10-digit US number.`,
    };
  }

  return { phone: normalized };
}

function parseInput(input: OrganizationInput): OrganizationInput | ActionResult {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Organization name is required." };
  }

  if (!RELATIONSHIP_TYPES.includes(input.relationshipType)) {
    return { ok: false, error: "Invalid relationship type." };
  }

  if (!ORGANIZATION_STATUSES.includes(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  const organizationPhone = parsePhoneField(input.phone, "Organization phone");
  if (organizationPhone.error) {
    return { ok: false, error: organizationPhone.error };
  }

  const contactPhone = parsePhoneField(input.contactPhone, "Contact phone");
  if (contactPhone.error) {
    return { ok: false, error: contactPhone.error };
  }

  return {
    name,
    relationshipType: input.relationshipType,
    status: input.status,
    category: clean(input.category) ?? undefined,
    website: clean(input.website) ?? undefined,
    email: clean(input.email) ?? undefined,
    phone: organizationPhone.phone,
    city: clean(input.city) ?? undefined,
    state: clean(input.state) ?? undefined,
    notes: clean(input.notes) ?? undefined,
    contactFirstName: clean(input.contactFirstName) ?? undefined,
    contactLastName: clean(input.contactLastName) ?? undefined,
    contactEmail: clean(input.contactEmail) ?? undefined,
    contactPhone: contactPhone.phone,
    contactTitle: clean(input.contactTitle) ?? undefined,
    contactId: input.contactId ?? null,
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

function hasContactDetails(input: OrganizationInput) {
  return Boolean(
    input.contactFirstName ||
      input.contactLastName ||
      input.contactEmail ||
      input.contactPhone ||
      input.contactTitle,
  );
}

async function syncPrimaryContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  input: OrganizationInput,
) {
  if (!hasContactDetails(input) && !input.contactId) {
    return { error: null };
  }

  let contactId = input.contactId ?? null;

  if (contactId) {
    const { error } = await supabase
      .from("contacts")
      .update({
        first_name: input.contactFirstName ?? null,
        last_name: input.contactLastName ?? null,
        email: input.contactEmail ?? null,
        phone: input.contactPhone ?? null,
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (error) {
      return { error: error.message };
    }
  } else if (hasContactDetails(input)) {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        first_name: input.contactFirstName ?? null,
        last_name: input.contactLastName ?? null,
        email: input.contactEmail ?? null,
        phone: input.contactPhone ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Failed to create contact." };
    }

    contactId = data.id;
  }

  if (!contactId) {
    return { error: null };
  }

  const { data: existingLink, error: linkLookupError } = await supabase
    .from("organization_contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (linkLookupError) {
    return { error: linkLookupError.message };
  }

  if (existingLink) {
    const { error } = await supabase
      .from("organization_contacts")
      .update({
        title: input.contactTitle ?? null,
        is_primary: true,
      })
      .eq("id", existingLink.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    await supabase
      .from("organization_contacts")
      .update({ is_primary: false })
      .eq("organization_id", organizationId);

    const { error } = await supabase.from("organization_contacts").insert({
      organization_id: organizationId,
      contact_id: contactId,
      title: input.contactTitle ?? null,
      is_primary: true,
    });

    if (error) {
      return { error: error.message };
    }
  }

  return { error: null };
}

async function syncRelationship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  relationshipType: RelationshipType,
) {
  const { error: deleteError } = await supabase
    .from("organization_relationships")
    .delete()
    .eq("organization_id", organizationId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const lifecycleStage =
    relationshipType === "lead"
      ? "lead"
      : relationshipType === "customer"
        ? "active"
        : "active";

  const { error } = await supabase.from("organization_relationships").insert({
    organization_id: organizationId,
    relationship_type: relationshipType,
    lifecycle_stage: lifecycleStage,
  });

  return { error: error?.message ?? null };
}

export async function createOrganization(
  input: OrganizationInput,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { data: organization, error } = await supabase
    .from("organizations")
    .insert({
      name: parsed.name,
      category: parsed.category ?? null,
      website: parsed.website ?? null,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !organization) {
    return { ok: false, error: error?.message ?? "Failed to create organization." };
  }

  const relationshipResult = await syncRelationship(
    supabase,
    organization.id,
    parsed.relationshipType,
  );
  if (relationshipResult.error) {
    return { ok: false, error: relationshipResult.error };
  }

  const contactResult = await syncPrimaryContact(
    supabase,
    organization.id,
    parsed,
  );
  if (contactResult.error) {
    return { ok: false, error: contactResult.error };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateOrganization(
  organizationId: string,
  input: OrganizationInput,
): Promise<ActionResult> {
  if (!organizationId) {
    return { ok: false, error: "Missing organization id." };
  }

  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.name,
      category: parsed.category ?? null,
      website: parsed.website ?? null,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const relationshipResult = await syncRelationship(
    supabase,
    organizationId,
    parsed.relationshipType,
  );
  if (relationshipResult.error) {
    return { ok: false, error: relationshipResult.error };
  }

  const contactResult = await syncPrimaryContact(
    supabase,
    organizationId,
    parsed,
  );
  if (contactResult.error) {
    return { ok: false, error: contactResult.error };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteOrganization(
  organizationId: string,
): Promise<ActionResult> {
  if (!organizationId) {
    return { ok: false, error: "Missing organization id." };
  }

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { data: links, error: linkError } = await supabase
    .from("organization_contacts")
    .select("contact_id")
    .eq("organization_id", organizationId);

  if (linkError) {
    return { ok: false, error: linkError.message };
  }

  const contactIds = (links ?? []).map((link) => link.contact_id);

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", organizationId);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (contactIds.length > 0) {
    await supabase.from("contacts").delete().in("id", contactIds);
  }

  revalidatePath("/admin");
  return { ok: true };
}
