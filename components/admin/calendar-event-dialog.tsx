"use client";

import { useState } from "react";

import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/app/admin/calendar/actions";
import { Button } from "@/components/ui/button";
import {
  CALENDAR_EVENT_TYPES,
  emptyCalendarEventFormValues,
  toDateTimeLocalValue,
  type CalendarEventType,
  type CalendarEventWithRelations,
} from "@/lib/calendar";

export type CalendarLeadOption = {
  id: string;
  business_name: string;
  contact_name: string;
  organization_id: string | null;
};

export type CalendarOrgOption = {
  id: string;
  name: string;
};

type CalendarEventDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  event?: CalendarEventWithRelations | null;
  defaults?: {
    startsAt?: string;
    leadId?: string | null;
    organizationId?: string | null;
    projectId?: string | null;
    title?: string;
    eventType?: CalendarEventType;
  };
  leads: CalendarLeadOption[];
  organizations: CalendarOrgOption[];
  onClose: () => void;
  onSaved: () => void;
};

export function CalendarEventDialog({
  open,
  mode,
  event,
  defaults,
  leads,
  organizations,
  onClose,
  onSaved,
}: CalendarEventDialogProps) {
  if (!open) return null;

  return (
    <CalendarEventDialogInner
      defaults={defaults}
      event={event}
      key={`${mode}-${event?.id ?? "new"}-${defaults?.startsAt ?? "blank"}`}
      leads={leads}
      mode={mode}
      onClose={onClose}
      onSaved={onSaved}
      organizations={organizations}
    />
  );
}

function CalendarEventDialogInner({
  mode,
  event,
  defaults,
  leads,
  organizations,
  onClose,
  onSaved,
}: Omit<CalendarEventDialogProps, "open">) {
  const [values, setValues] = useState(() => {
    if (mode === "edit" && event) {
      return {
        title: event.title,
        eventType: event.event_type,
        startsAt: toDateTimeLocalValue(event.starts_at),
        endsAt: event.ends_at ? toDateTimeLocalValue(event.ends_at) : "",
        location: event.location ?? "",
        notes: event.notes ?? "",
        leadId: event.lead_id ?? "",
        organizationId: event.organization_id ?? "",
        projectId: event.project_id ?? "",
      };
    }

    return emptyCalendarEventFormValues(defaults);
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateField<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title: values.title,
      eventType: values.eventType,
      startsAt: values.startsAt,
      endsAt: values.endsAt || undefined,
      location: values.location,
      notes: values.notes,
      leadId: values.leadId || null,
      organizationId: values.organizationId || null,
      projectId: values.projectId || null,
    };

    const result =
      mode === "edit" && event
        ? await updateCalendarEvent(event.id, payload)
        : await createCalendarEvent(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to save event.");
      return;
    }

    onSaved();
  }

  async function onDelete() {
    if (!event) return;
    const confirmed = window.confirm(
      `Delete "${event.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const result = await deleteCalendarEvent(event.id, {
      leadId: event.lead_id,
      organizationId: event.organization_id,
      projectId: event.project_id,
    });

    setDeleting(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete event.");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-4 sm:items-center">
      <div
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "edit" ? "Edit event" : "Schedule event"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Book consults, onsites, calls, and follow-ups on the calendar.
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
              {error}
            </div>
          ) : null}

          <label className="block space-y-2 text-sm font-semibold">
            Title
            <input
              className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(e) => updateField("title", e.target.value)}
              required
              value={values.title}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              Type
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(e) =>
                  updateField("eventType", e.target.value as CalendarEventType)
                }
                value={values.eventType}
              >
                {CALENDAR_EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Location
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Zoom, office, customer site…"
                value={values.location}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Starts
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(e) => updateField("startsAt", e.target.value)}
                required
                type="datetime-local"
                value={values.startsAt}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Ends
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(e) => updateField("endsAt", e.target.value)}
                type="datetime-local"
                value={values.endsAt}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Lead
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(e) => {
                  const leadId = e.target.value;
                  const lead = leads.find((item) => item.id === leadId);
                  updateField("leadId", leadId);
                  if (lead?.organization_id) {
                    updateField("organizationId", lead.organization_id);
                  }
                  if (lead && !values.title) {
                    updateField(
                      "title",
                      `${calendarTypeDefaultTitle(values.eventType)} — ${lead.business_name}`,
                    );
                  }
                }}
                value={values.leadId}
              >
                <option value="">Select a lead…</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.business_name} ({lead.contact_name})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Business
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(e) => updateField("organizationId", e.target.value)}
                value={values.organizationId}
              >
                <option value="">None / not linked</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold">
            Notes
            <textarea
              className="min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(e) => updateField("notes", e.target.value)}
              value={values.notes}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {mode === "edit" ? (
              <Button
                disabled={deleting || loading}
                onClick={onDelete}
                type="button"
                variant="outline"
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button onClick={onClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={loading} type="submit" variant="accent">
                {loading
                  ? "Saving…"
                  : mode === "edit"
                    ? "Save changes"
                    : "Schedule"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function calendarTypeDefaultTitle(type: CalendarEventType) {
  return CALENDAR_EVENT_TYPES.find((item) => item.value === type)?.label ?? "Event";
}
