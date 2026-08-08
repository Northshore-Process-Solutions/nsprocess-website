"use server";

import { revalidatePath } from "next/cache";

import { syncNextActionForEventTargets } from "@/app/crm/projects/actions";
import {
  CALENDAR_EVENT_TYPES,
  calendarEventTypeLabel,
  type CalendarEventType,
} from "@/lib/calendar";
import { buildCalendarInviteIcs, formatMeetingWhen } from "@/lib/ics";
import { escapeHtml, sendAppEmail } from "@/lib/mail";
import { contact } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/server";

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
  /** Email the linked contact an Outlook-compatible calendar invite. */
  notifyContact?: boolean;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
  inviteSent?: boolean;
  inviteError?: string;
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
    notifyContact: Boolean(input.notifyContact),
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

async function resolveInviteRecipient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    leadId?: string | null;
    organizationId?: string | null;
    projectId?: string | null;
  },
): Promise<{ email: string; name: string | null } | null> {
  if (input.leadId) {
    const { data: lead } = await supabase
      .from("leads")
      .select("email, contact_name")
      .eq("id", input.leadId)
      .maybeSingle();

    const email = clean(lead?.email);
    if (email) {
      return { email, name: clean(lead?.contact_name) };
    }
  }

  let organizationId = input.organizationId ?? null;
  if (!organizationId && input.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("organization_id, lead_id")
      .eq("id", input.projectId)
      .maybeSingle();

    organizationId = project?.organization_id ?? null;
    if (!organizationId && project?.lead_id) {
      const { data: lead } = await supabase
        .from("leads")
        .select("email, contact_name, organization_id")
        .eq("id", project.lead_id)
        .maybeSingle();
      const email = clean(lead?.email);
      if (email) {
        return { email, name: clean(lead?.contact_name) };
      }
      organizationId = lead?.organization_id ?? null;
    }
  }

  if (!organizationId) return null;

  const { data: organization } = await supabase
    .from("organizations")
    .select("email, name")
    .eq("id", organizationId)
    .maybeSingle();

  const { data: links } = await supabase
    .from("organization_contacts")
    .select(
      `
      is_primary,
      contacts (
        email,
        first_name,
        last_name
      )
    `,
    )
    .eq("organization_id", organizationId)
    .order("is_primary", { ascending: false })
    .limit(5);

  for (const row of links ?? []) {
    const person = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
    const email = clean(person?.email);
    if (!email) continue;
    const name = [person?.first_name, person?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return { email, name: name || null };
  }

  const orgEmail = clean(organization?.email);
  if (orgEmail) {
    return { email: orgEmail, name: clean(organization?.name) };
  }

  return null;
}

async function sendCalendarInviteEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    eventId: string;
    title: string;
    eventType: CalendarEventType;
    startsAt: string;
    endsAt?: string | null;
    location?: string | null;
    notes?: string | null;
    leadId?: string | null;
    organizationId?: string | null;
    projectId?: string | null;
    sequence?: number;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const recipient = await resolveInviteRecipient(supabase, input);
  if (!recipient) {
    return {
      ok: false,
      error: "No contact email found for this lead or business.",
    };
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = input.endsAt
    ? new Date(input.endsAt)
    : new Date(startsAt.getTime() + 60 * 60 * 1000);

  const whenLabel = formatMeetingWhen(startsAt, endsAt);
  const typeLabel = calendarEventTypeLabel(input.eventType);
  const greeting = recipient.name ? `Hi ${recipient.name},` : "Hello,";
  const subject = `${typeLabel} scheduled: ${input.title}`;

  const text = [
    greeting,
    "",
    `You're invited to a ${typeLabel.toLowerCase()} with North Shore Process Solutions.`,
    "",
    `What: ${input.title}`,
    `When: ${whenLabel.replaceAll("\n", " · ")}`,
    input.location ? `Where: ${input.location}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
    "",
    "A calendar invite (.ics) is attached — open it to add this to Outlook or another calendar.",
    "",
    "If you need to reschedule, just reply to this email.",
    "",
    "North Shore Process Solutions",
    contact.phone,
    contact.email,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>You're invited to a <strong>${escapeHtml(typeLabel.toLowerCase())}</strong> with North Shore Process Solutions.</p>
    <p>
      <strong>What:</strong> ${escapeHtml(input.title)}<br />
      <strong>When:</strong> ${escapeHtml(whenLabel).replaceAll("\n", "<br />")}
      ${input.location ? `<br /><strong>Where:</strong> ${escapeHtml(input.location)}` : ""}
    </p>
    ${
      input.notes
        ? `<p><strong>Notes:</strong><br />${escapeHtml(input.notes).replaceAll("\n", "<br />")}</p>`
        : ""
    }
    <p>A calendar invite (<code>.ics</code>) is attached — open it to add this to Outlook or another calendar.</p>
    <p>If you need to reschedule, just reply to this email.</p>
    <p>North Shore Process Solutions<br />${escapeHtml(contact.phone)}<br />${escapeHtml(contact.email)}</p>
  `;

  const ics = buildCalendarInviteIcs({
    uid: `${input.eventId}@nsprocess.com`,
    title: input.title,
    eventType: input.eventType,
    startsAt,
    endsAt,
    location: input.location,
    notes: input.notes,
    organizerEmail: contact.email,
    attendeeEmail: recipient.email,
    attendeeName: recipient.name,
    sequence: input.sequence ?? 0,
  });

  const mailResult = await sendAppEmail({
    to: recipient.email,
    subject,
    text,
    html,
    replyTo: contact.email,
    attachments: [
      {
        filename: "invite.ics",
        content: ics,
        contentType: "text/calendar; charset=utf-8; method=REQUEST",
      },
    ],
    icalEvent: {
      method: "REQUEST",
      content: ics,
      filename: "invite.ics",
    },
  });

  if (!mailResult.ok) {
    return { ok: false, error: mailResult.error };
  }

  const hasActivityTarget =
    input.leadId || input.organizationId || input.projectId;
  if (hasActivityTarget) {
    await supabase.from("activities").insert({
      lead_id: input.leadId ?? null,
      organization_id: input.organizationId ?? null,
      project_id: input.projectId ?? null,
      activity_type: "email",
      email_direction: "sent",
      email_address: recipient.email,
      subject,
      body: text,
      occurred_at: new Date().toISOString(),
    });
  }

  return { ok: true };
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

  if (!parsed.notifyContact) {
    return { ok: true, id: data.id };
  }

  const invite = await sendCalendarInviteEmail(supabase, {
    eventId: data.id,
    title: parsed.title,
    eventType: parsed.eventType,
    startsAt: new Date(parsed.startsAt).toISOString(),
    endsAt: parsed.endsAt ? new Date(parsed.endsAt).toISOString() : null,
    location: parsed.location,
    notes: parsed.notes,
    leadId: parsed.leadId,
    organizationId: parsed.organizationId,
    projectId: parsed.projectId,
    sequence: 0,
  });

  if (!invite.ok) {
    return {
      ok: true,
      id: data.id,
      inviteSent: false,
      inviteError: invite.error,
    };
  }

  revalidateCalendar(parsed);
  return { ok: true, id: data.id, inviteSent: true };
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

  if (!parsed.notifyContact) {
    return { ok: true, id: eventId };
  }

  const invite = await sendCalendarInviteEmail(supabase, {
    eventId,
    title: parsed.title,
    eventType: parsed.eventType,
    startsAt: new Date(parsed.startsAt).toISOString(),
    endsAt: parsed.endsAt ? new Date(parsed.endsAt).toISOString() : null,
    location: parsed.location,
    notes: parsed.notes,
    leadId: parsed.leadId,
    organizationId: parsed.organizationId,
    projectId: parsed.projectId,
    sequence: 1,
  });

  if (!invite.ok) {
    return {
      ok: true,
      id: eventId,
      inviteSent: false,
      inviteError: invite.error,
    };
  }

  revalidateCalendar(parsed);
  return { ok: true, id: eventId, inviteSent: true };
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
