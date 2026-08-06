"use server";

import { revalidatePath } from "next/cache";

import {
  ACTIVITY_TYPES,
  type ActivityType,
  type EmailDirection,
} from "@/lib/activities";
import { createClient } from "@/lib/supabase/server";

export type ActivityInput = {
  organizationId?: string | null;
  leadId?: string | null;
  projectId?: string | null;
  activityType: ActivityType;
  emailDirection?: EmailDirection | null;
  subject?: string;
  body?: string;
  occurredAt?: string;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
};

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

function parseInput(input: ActivityInput): ActivityInput | ActionResult {
  const organizationId = clean(input.organizationId) ?? null;
  const leadId = clean(input.leadId) ?? null;
  const projectId = clean(input.projectId) ?? null;

  if (!organizationId && !leadId && !projectId) {
    return {
      ok: false,
      error: "Activity must belong to a lead, business, or project.",
    };
  }

  if (!ACTIVITY_TYPES.some((item) => item.value === input.activityType)) {
    return { ok: false, error: "Invalid activity type." };
  }

  let emailDirection: EmailDirection | null = null;
  if (input.activityType === "email") {
    if (
      input.emailDirection !== "sent" &&
      input.emailDirection !== "received"
    ) {
      return { ok: false, error: "Choose sent or received for email." };
    }
    emailDirection = input.emailDirection;
  }

  const occurredAt = clean(input.occurredAt);
  if (occurredAt) {
    const parsed = new Date(occurredAt);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "Invalid activity date." };
    }
  }

  return {
    organizationId,
    leadId,
    projectId,
    activityType: input.activityType,
    emailDirection,
    subject: clean(input.subject) ?? undefined,
    body: clean(input.body) ?? undefined,
    occurredAt: occurredAt ?? undefined,
  };
}

function revalidateTargets(input: {
  organizationId?: string | null;
  leadId?: string | null;
  projectId?: string | null;
}) {
  revalidatePath("/crm");
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/projects");
  if (input.organizationId) {
    revalidatePath(`/crm/organizations/${input.organizationId}`);
  }
  if (input.projectId) {
    revalidatePath(`/crm/projects/${input.projectId}`);
  }
}

export async function createActivity(
  input: ActivityInput,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const occurredAt = parsed.occurredAt
    ? new Date(parsed.occurredAt).toISOString()
    : new Date().toISOString();

  const { error } = await supabase.from("activities").insert({
    organization_id: parsed.organizationId ?? null,
    lead_id: parsed.leadId ?? null,
    project_id: parsed.projectId ?? null,
    activity_type: parsed.activityType,
    email_direction: parsed.emailDirection ?? null,
    subject: parsed.subject ?? null,
    body: parsed.body ?? null,
    occurred_at: occurredAt,
  });

  if (error) return { ok: false, error: error.message };

  revalidateTargets(parsed);
  return { ok: true };
}

export async function updateActivity(
  activityId: string,
  input: ActivityInput,
): Promise<ActionResult> {
  if (!activityId) return { ok: false, error: "Missing activity id." };

  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const occurredAt = parsed.occurredAt
    ? new Date(parsed.occurredAt).toISOString()
    : new Date().toISOString();

  const { error } = await supabase
    .from("activities")
    .update({
      organization_id: parsed.organizationId ?? null,
      lead_id: parsed.leadId ?? null,
      project_id: parsed.projectId ?? null,
      activity_type: parsed.activityType,
      email_direction: parsed.emailDirection ?? null,
      subject: parsed.subject ?? null,
      body: parsed.body ?? null,
      occurred_at: occurredAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", activityId);

  if (error) return { ok: false, error: error.message };

  revalidateTargets(parsed);
  return { ok: true };
}

export async function deleteActivity(
  activityId: string,
  targets?: {
    organizationId?: string | null;
    leadId?: string | null;
    projectId?: string | null;
  },
): Promise<ActionResult> {
  if (!activityId) return { ok: false, error: "Missing activity id." };

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId);

  if (error) return { ok: false, error: error.message };

  revalidateTargets(targets ?? {});
  return { ok: true };
}
