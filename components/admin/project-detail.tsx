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
  const nextEvent = upcoming[0] ?? events[events.length - 1] ?? null;
  const calendarHref = project.lead_id
    ? `/admin/calendar?leadId=${project.lead_id}`
    : "/admin/calendar";

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
    <div className="space-y-5">
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
            {project.started_at ? (
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                Started{" "}
                {new Date(`${project.started_at}T12:00:00`).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
        <Button
          disabled={!lead}
          onClick={() => setReplyOpen(true)}
          type="button"
          variant="outline"
        >
          <Mail aria-hidden className="size-4" />
          Email
        </Button>
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
                  <dd className="mt-1 line-clamp-3 whitespace-pre-wrap leading-6 text-foreground/90">
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden className="size-4 text-accent" />
              <h2 className="text-lg font-semibold">Events</h2>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href={calendarHref}>Calendar</Link>
            </Button>
          </div>

          {nextEvent ? (
            <button
              className="mt-4 w-full rounded-2xl border border-border bg-background p-4 text-left transition hover:bg-secondary/40"
              onClick={() => openEditEvent(nextEvent)}
              type="button"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {upcoming[0] ? "Next" : "Latest"}
              </p>
              <p className="mt-1 font-semibold">{nextEvent.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {calendarEventTypeLabel(nextEvent.event_type)} ·{" "}
                {new Date(nextEvent.starts_at).toLocaleDateString()}{" "}
                {formatEventTime(nextEvent.starts_at)}
              </p>
            </button>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Nothing scheduled yet.
            </p>
          )}

          {upcoming.length > 1 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              +{upcoming.length - 1} more upcoming — view on calendar
            </p>
          ) : events.length > 0 && upcoming.length <= 1 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {events.length} event{events.length === 1 ? "" : "s"} total —
              view on calendar
            </p>
          ) : null}

          <Button
            className="mt-4 w-full"
            onClick={openCreateEvent}
            type="button"
            variant="accent"
          >
            <Plus aria-hidden className="size-4" />
            Schedule event
          </Button>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityPanel
            activities={activities}
            compact
            leadId={project.lead_id}
            organizationId={project.organization_id}
            projectId={project.id}
          />
        </div>

        <form
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2"
          onSubmit={onSubmit}
        >
          <div>
            <h2 className="text-lg font-semibold">Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Status and a short summary.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">
              {error}
            </div>
          ) : null}
          {saved ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
              Saved.
            </div>
          ) : null}

          <label className="block space-y-2 text-sm font-semibold">
            Name
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold">
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

          <label className="block space-y-2 text-sm font-semibold">
            Started
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setStartedAt(event.target.value)}
              type="date"
              value={startedAt}
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold">
            Internal summary
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional high-level summary."
              value={notes}
            />
          </label>

          <Button disabled={loading} type="submit" variant="accent">
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
      </div>

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
