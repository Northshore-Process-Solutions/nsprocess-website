"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, Plus } from "lucide-react";
import { useState } from "react";

import {
  updateProject,
  type ProjectInput,
} from "@/app/admin/projects/actions";
import { ActivityPanel } from "@/components/admin/activity-panel";
import {
  CalendarEventDialog,
  type CalendarLeadOption,
  type CalendarOrgOption,
} from "@/components/admin/calendar-event-dialog";
import { LeadReplyDialog } from "@/components/admin/lead-reply-dialog";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import {
  calendarEventTypeLabel,
  formatEventTime,
  type CalendarEventWithRelations,
} from "@/lib/calendar";
import type { LeadRow } from "@/lib/leads";
import {
  PROJECT_STATUSES,
  projectStatusLabel,
  type ProjectWithOrganization,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  planning: "bg-sky-50 text-sky-800 border-sky-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-900 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

const eventTypeStyles: Record<string, string> = {
  consult: "bg-indigo-100 text-indigo-900",
  onsite: "bg-teal-100 text-teal-900",
  call: "bg-sky-100 text-sky-900",
  follow_up: "bg-amber-100 text-amber-950",
  other: "bg-stone-100 text-stone-800",
};

type ProjectDetailProps = {
  project: ProjectWithOrganization;
  lead: LeadRow | null;
  activities: ActivityRow[];
  events: CalendarEventWithRelations[];
};

export function ProjectDetail({
  project,
  lead,
  activities,
  events,
}: ProjectDetailProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [startedAt, setStartedAt] = useState(project.started_at ?? "");
  const [notes, setNotes] = useState(project.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventMode, setEventMode] = useState<"create" | "edit">("create");
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEventWithRelations | null>(null);

  const leadOptions: CalendarLeadOption[] = lead
    ? [
        {
          id: lead.id,
          business_name: lead.business_name,
          contact_name: lead.contact_name,
          organization_id: lead.organization_id,
        },
      ]
    : [];

  const orgOptions: CalendarOrgOption[] = project.organizations
    ? [{ id: project.organizations.id, name: project.organizations.name }]
    : [];

  const upcoming = events.filter(
    (event) => new Date(event.starts_at).getTime() >= Date.now(),
  );
  const nextEvent = upcoming[0] ?? null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const payload: ProjectInput = {
      name,
      status,
      startedAt: startedAt || undefined,
      notes: notes || undefined,
    };

    const result = await updateProject(project.id, payload);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to save project.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  function openCreateEvent() {
    setEventMode("create");
    setSelectedEvent(null);
    setEventDialogOpen(true);
  }

  function openEditEvent(event: CalendarEventWithRelations) {
    setEventMode("edit");
    setSelectedEvent(event);
    setEventDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            href="/admin/projects"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to Projects
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {project.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                statusStyles[project.status] ?? statusStyles.active,
              )}
            >
              {projectStatusLabel(project.status)}
            </span>
            {project.organizations ? (
              <Link
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-accent hover:underline"
                href={`/admin/organizations/${project.organizations.id}`}
              >
                {project.organizations.name}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!lead}
            onClick={() => setReplyOpen(true)}
            type="button"
            variant="outline"
          >
            <Mail aria-hidden className="size-4" />
            Email
          </Button>
          <Button onClick={openCreateEvent} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <h2 className="text-lg font-semibold">Contact</h2>
          {lead ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Business</dt>
                <dd className="mt-1 font-medium">{lead.business_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="mt-1 font-medium">{lead.contact_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 font-medium">
                  <a
                    className="text-accent hover:underline"
                    href={`mailto:${lead.email}`}
                  >
                    {lead.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="mt-1 font-medium">{lead.phone || "—"}</dd>
              </div>
              {lead.message ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Original inquiry</dt>
                  <dd className="mt-1 whitespace-pre-wrap leading-6 text-foreground/90">
                    {lead.message}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No linked lead on this project.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <CalendarDays aria-hidden className="size-4 text-accent" />
            <h2 className="text-lg font-semibold">Next event</h2>
          </div>
          {nextEvent ? (
            <button
              className="mt-4 w-full rounded-2xl border border-border bg-background p-4 text-left transition hover:bg-secondary/40"
              onClick={() => openEditEvent(nextEvent)}
              type="button"
            >
              <p className="font-semibold">{nextEvent.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {calendarEventTypeLabel(nextEvent.event_type)} ·{" "}
                {new Date(nextEvent.starts_at).toLocaleDateString()}{" "}
                {formatEventTime(nextEvent.starts_at)}
              </p>
            </button>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing scheduled. Book an onsite, call, or follow-up.
            </p>
          )}
          <Button
            className="mt-4 w-full"
            onClick={openCreateEvent}
            type="button"
            variant="outline"
          >
            Schedule event
          </Button>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Calendar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Events for this project, including history from the original
              lead.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/calendar">Open calendar</Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="font-semibold">No events yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Schedule onsites, calls, and check-ins from here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <button
                  className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-left transition hover:bg-secondary/40"
                  onClick={() => openEditEvent(event)}
                  type="button"
                >
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(event.starts_at).toLocaleString()}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      eventTypeStyles[event.event_type] ??
                        eventTypeStyles.other,
                    )}
                  >
                    {calendarEventTypeLabel(event.event_type)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActivityPanel
        activities={activities}
        leadId={project.lead_id}
        organizationId={project.organization_id}
        projectId={project.id}
      />

      <form
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-lg font-semibold">Project details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status and a short internal summary. Use the activity log for
            ongoing notes.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
            {error}
          </div>
        ) : null}
        {saved ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
            Project saved.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">
            Name
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold">
            Status
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
              value={status}
            >
              {PROJECT_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold">
            Started
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setStartedAt(event.target.value)}
              type="date"
              value={startedAt}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold sm:col-span-2">
            Internal summary
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional high-level summary — use Activity log for dated notes."
              value={notes}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <Button disabled={loading} type="submit" variant="accent">
            {loading ? "Saving…" : "Save project"}
          </Button>
        </div>
      </form>

      <LeadReplyDialog
        lead={lead}
        onClose={() => setReplyOpen(false)}
        onSent={() => {
          setReplyOpen(false);
          router.refresh();
        }}
        open={replyOpen}
        projectId={project.id}
      />

      <CalendarEventDialog
        defaults={{
          leadId: project.lead_id,
          organizationId: project.organization_id,
          projectId: project.id,
          title: lead
            ? `Onsite — ${lead.business_name}`
            : project.organizations
              ? `Onsite — ${project.organizations.name}`
              : "Project meeting",
          eventType: "onsite",
        }}
        event={selectedEvent}
        leads={leadOptions}
        mode={eventMode}
        onClose={() => setEventDialogOpen(false)}
        onSaved={() => {
          setEventDialogOpen(false);
          router.refresh();
        }}
        open={eventDialogOpen}
        organizations={orgOptions}
      />
    </div>
  );
}
