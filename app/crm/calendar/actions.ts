"use server";

import { revalidatePath } from "next/cache";

import {
  CALENDAR_EVENT_TYPES,
  type CalendarEventType,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { syncNextActionForEventTargets } from "@/app/crm/projects/actions";

export type CalendarEventInput = {
  title: string;
  eventType: CalendarEventType;
  startsAt: string;
  endsAt?: string;
  location?: string;
  notes?: string;
  leadId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
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

function parseInput(input: CalendarEventInput): CalendarEventInput | ActionResult {
  const title = clean(input.title);
  if (!title) return { ok: false, error: "Title is required." };

  if (!CALENDAR_EVENT_TYPES.some((item) => item.value === input.eventType)) {
    return { ok: false, error: "Invalid event type." };
  }

  const startsAt = clean(input.startsAt);
  if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) {
    return { ok: false, error: "Start time is required." };
  }

  const endsAt = clean(input.endsAt);
  if (endsAt && Number.isNaN(new Date(endsAt).getTime())) {
    return { ok: false, error: "End time is invalid." };
  }

  if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    return { ok: false, error: "End time must be after start time." };
  }

  const leadId = clean(input.leadId);
  const organizationId = clean(input.organizationId);
  const projectId = clean(input.projectId);

  if (!leadId && !organizationId && !projectId) {
    return {
      ok: false,
      error: "Link the event to a lead, business, or project.",
    };
  }

  return {
    title,
    eventType: input.eventType,
    startsAt,
    endsAt: endsAt ?? undefined,
    location: clean(input.location) ?? undefined,
    notes: clean(input.notes) ?? undefined,
    leadId,
    organizationId,
    projectId,
  };
}

function revalidateCalendar(targets?: {
  leadId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
}) {
  revalidatePath("/crm/calendar");
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/projects");
  if (targets?.organizationId) {
    revalidatePath(`/crm/organizations/${targets.organizationId}`);
  }
  if (targets?.projectId) {
    revalidatePath(`/crm/projects/${targets.projectId}`);
  }
}

async function maybeMarkConsultBooked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    eventType: CalendarEventType;
    leadId?: string | null;
  },
) {
  if (input.eventType !== "consult" || !input.leadId) return;

  const { data: lead } = await supabase
    .from("leads")
    .select("id, stage")
    .eq("id", input.leadId)
    .maybeSingle();

  if (!lead) return;

  const earlyStages = new Set(["new_inquiry", "follow_up"]);
  if (!earlyStages.has(lead.stage)) return;

  await supabase
    .from("leads")
    .update({
      stage: "review_booked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", lead.id);
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: parsed.title,
      event_type: parsed.eventType,
      starts_at: new Date(parsed.startsAt).toISOString(),
      ends_at: parsed.endsAt
        ? new Date(parsed.endsAt).toISOString()
        : null,
      location: parsed.location ?? null,
      notes: parsed.notes ?? null,
      lead_id: parsed.leadId ?? null,
      organization_id: parsed.organizationId ?? null,
      project_id: parsed.projectId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create event." };
  }

  await maybeMarkConsultBooked(supabase, parsed);
  await syncNextActionForEventTargets(supabase, {
    projectId: parsed.projectId,
    leadId: parsed.leadId,
  });
  revalidateCalendar(parsed);
  return { ok: true, id: data.id };
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput,
): Promise<ActionResult> {
  if (!eventId) return { ok: false, error: "Missing event id." };

  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { data: existing } = await supabase
    .from("calendar_events")
    .select("project_id, lead_id")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: parsed.title,
      event_type: parsed.eventType,
      starts_at: new Date(parsed.startsAt).toISOString(),
      ends_at: parsed.endsAt
        ? new Date(parsed.endsAt).toISOString()
        : null,
      location: parsed.location ?? null,
      notes: parsed.notes ?? null,
      lead_id: parsed.leadId ?? null,
      organization_id: parsed.organizationId ?? null,
      project_id: parsed.projectId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };

  await maybeMarkConsultBooked(supabase, parsed);
  await syncNextActionForEventTargets(supabase, {
    projectId: parsed.projectId ?? existing?.project_id,
    leadId: parsed.leadId ?? existing?.lead_id,
  });
  if (existing?.project_id && existing.project_id !== parsed.projectId) {
    await syncNextActionForEventTargets(supabase, {
      projectId: existing.project_id,
      leadId: existing.lead_id,
    });
  }
  revalidateCalendar(parsed);
  return { ok: true, id: eventId };
}

export async function deleteCalendarEvent(
  eventId: string,
  targets?: {
    leadId?: string | null;
    organizationId?: string | null;
    projectId?: string | null;
  },
): Promise<ActionResult> {
  if (!eventId) return { ok: false, error: "Missing event id." };

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { data: existing } = await supabase
    .from("calendar_events")
    .select("project_id, lead_id")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };

  await syncNextActionForEventTargets(supabase, {
    projectId: targets?.projectId ?? existing?.project_id,
    leadId: targets?.leadId ?? existing?.lead_id,
  });
  revalidateCalendar(targets ?? {});
  return { ok: true };
}
