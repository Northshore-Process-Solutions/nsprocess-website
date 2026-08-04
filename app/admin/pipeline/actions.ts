"use server";

import { revalidatePath } from "next/cache";

import {
  LEAD_SOURCES,
  LEAD_STAGES,
  type LeadSource,
  type LeadStage,
} from "@/lib/leads";
import { normalizeUsPhone } from "@/lib/phone";
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

export async function createLead(input: LeadInput): Promise<ActionResult> {
  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase.from("leads").insert(toDbPayload(parsed));
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pipeline");
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

  revalidatePath("/admin/pipeline");
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

  revalidatePath("/admin/pipeline");
  return { ok: true };
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Missing lead id." };

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pipeline");
  return { ok: true };
}
