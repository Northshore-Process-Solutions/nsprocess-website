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
import { ProjectTasksPanel } from "@/components/admin/project-tasks-panel";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import {
  calendarEventTypeLabel,
  formatEventTime,
  type CalendarEventWithRelations,
} from "@/lib/calendar";
import type { LeadRow } from "@/lib/leads";
import {
  isNextActionOverdue,
  isProjectPastTarget,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  projectPriorityLabel,
  projectStatusLabel,
  resolveProjectNextAction,
  type ProjectPriority,
  type ProjectTaskRow,
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

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  normal: "bg-sky-50 text-sky-800 border-sky-200",
  high: "bg-red-50 text-red-800 border-red-200",
};

type ProjectDetailProps = {
  project: ProjectWithOrganization;
  lead: LeadRow | null;
  activities: ActivityRow[];
  events: CalendarEventWithRelations[];
  tasks: ProjectTaskRow[];
};

function isPastEvent(event: CalendarEventWithRelations, now = Date.now()) {
  const end = event.ends_at
    ? new Date(event.ends_at).getTime()
    : new Date(event.starts_at).getTime();
  return end < now;
}

function ProjectEventsDialog({
  open,
  events,
  onClose,
  onSelect,
}: {
  open: boolean;
  events: CalendarEventWithRelations[];
  onClose: () => void;
  onSelect: (event: CalendarEventWithRelations) => void;
}) {
  const [showPast, setShowPast] = useState(false);
  const now = Date.now();

  if (!open) return null;

  const upcoming = events
    .filter((event) => !isPastEvent(event, now))
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const past = events
    .filter((event) => isPastEvent(event, now))
    .sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
    );
  const visible = showPast ? [...upcoming, ...past] : upcoming;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-4 sm:items-center">
      <div
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">All events</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {upcoming.length} upcoming
              {past.length > 0 ? ` · ${past.length} past` : ""}
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6">
          <p className="text-sm font-medium text-muted-foreground">
            Show past events
          </p>
          <button
            aria-checked={showPast}
            aria-label="Show past events"
            className={cn(
              "relative h-7 w-12 rounded-full transition",
              showPast ? "bg-accent" : "bg-muted",
            )}
            onClick={() => setShowPast((current) => !current)}
            role="switch"
            type="button"
          >
            <span
              className={cn(
                "absolute top-0.5 size-6 rounded-full bg-card shadow transition",
                showPast ? "left-5" : "left-0.5",
              )}
            />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-semibold">
                {showPast ? "No events yet" : "No upcoming events"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {showPast
                  ? "Schedule an event to get started."
                  : "Turn on past events to see history, or schedule something new."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((event) => {
                const pastEvent = isPastEvent(event, now);
                return (
                  <li key={event.id}>
                    <button
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-left transition hover:bg-secondary/40",
                        pastEvent && "opacity-70",
                      )}
                      onClick={() => onSelect(event)}
                      type="button"
                    >
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(event.starts_at).toLocaleString()}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            eventTypeStyles[event.event_type] ??
                              eventTypeStyles.other,
                          )}
                        >
                          {calendarEventTypeLabel(event.event_type)}
                        </span>
                        {pastEvent ? (
                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Past
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectDetail({
  project,
  lead,
  activities,
  events,
  tasks,
}: ProjectDetailProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [priority, setPriority] = useState<ProjectPriority>(
    project.priority ?? "normal",
  );
  const [startedAt, setStartedAt] = useState(project.started_at ?? "");
  const [targetEndAt, setTargetEndAt] = useState(project.target_end_at ?? "");
  const [scope, setScope] = useState(project.scope ?? "");
  const [notes, setNotes] = useState(project.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
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
  const openTaskCount = tasks.filter((task) => !task.is_done).length;
  const resolvedNext = resolveProjectNextAction({ tasks, events });
  const overdueAction = isNextActionOverdue({
    next_action_at: resolvedNext.at,
    status: project.status,
  });
  const pastTarget = isProjectPastTarget(project);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const payload: ProjectInput = {
      name,
      status,
      priority,
      startedAt: startedAt || undefined,
      targetEndAt: targetEndAt || undefined,
      scope: scope || undefined,
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
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                priorityStyles[project.priority] ?? priorityStyles.normal,
              )}
            >
              {projectPriorityLabel(project.priority)}
            </span>
            {project.organizations ? (
              <Link
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-accent hover:underline"
                href={`/admin/organizations/${project.organizations.id}`}
              >
                {project.organizations.name}
              </Link>
            ) : null}
            {pastTarget ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                Past target end
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

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Next action
          </p>
          <p
            className={cn(
              "mt-1 font-semibold",
              overdueAction && "text-red-700",
            )}
          >
            {resolvedNext.label || "Add a task or schedule an event"}
          </p>
          <p
            className={cn(
              "mt-1 text-xs text-muted-foreground",
              overdueAction && "font-semibold text-red-700",
            )}
          >
            {resolvedNext.source
              ? resolvedNext.source === "task"
                ? "From task"
                : "From event"
              : "Auto from tasks & events"}
            {resolvedNext.at
              ? ` · ${new Date(`${resolvedNext.at}T12:00:00`).toLocaleDateString()}`
              : ""}
            {overdueAction ? " · Overdue" : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Open tasks
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {openTaskCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Target end
          </p>
          <p className={cn("mt-1 font-semibold", pastTarget && "text-red-700")}>
            {project.target_end_at
              ? new Date(
                  `${project.target_end_at}T12:00:00`,
                ).toLocaleDateString()
              : "Not set"}
          </p>
        </div>
      </section>

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
          <div className="flex items-center gap-2">
            <CalendarDays aria-hidden className="size-4 text-accent" />
            <h2 className="text-lg font-semibold">Events</h2>
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
              +{upcoming.length - 1} more upcoming
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={openCreateEvent} type="button" variant="accent">
              <Plus aria-hidden className="size-4" />
              Schedule
            </Button>
            <Button
              onClick={() => setEventsOpen(true)}
              type="button"
              variant="outline"
            >
              View all
            </Button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <ProjectTasksPanel projectId={project.id} tasks={tasks} />
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
              Status, dates, and scope. Next action comes from your soonest open
              task or upcoming event.
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

          <div className="grid gap-4 sm:grid-cols-2">
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
              Priority
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setPriority(event.target.value as ProjectPriority)
                }
                value={priority}
              >
                {PROJECT_PRIORITIES.map((item) => (
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
            <label className="space-y-2 text-sm font-semibold">
              Target end
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setTargetEndAt(event.target.value)}
                type="date"
                value={targetEndAt}
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold">
            Scope
            <textarea
              className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setScope(event.target.value)}
              placeholder="What this engagement covers."
              value={scope}
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold">
            Internal summary
            <textarea
              className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional high-level notes."
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

      <ProjectEventsDialog
        events={events}
        onClose={() => setEventsOpen(false)}
        onSelect={(event) => {
          setEventsOpen(false);
          openEditEvent(event);
        }}
        open={eventsOpen}
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
