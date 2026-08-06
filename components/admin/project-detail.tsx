"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  updateProject,
  type ProjectInput,
} from "@/app/crm/projects/actions";
import { ActivityPanel } from "@/components/admin/activity-panel";
import {
  CalendarEventDialog,
  type CalendarLeadOption,
  type CalendarOrgOption,
} from "@/components/admin/calendar-event-dialog";
import { LeadReplyDialog } from "@/components/admin/lead-reply-dialog";
import { ProjectTasksPanel } from "@/components/admin/project-tasks-panel";
import { PurchasesPanel } from "@/components/admin/purchases-panel";
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
  type ProjectStatus,
  type ProjectTaskRow,
  type ProjectWithOrganization,
} from "@/lib/projects";
import type { PurchaseWithRelations } from "@/lib/purchases";
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
  purchases: PurchaseWithRelations[];
};

type EditSection = "identity" | "schedule" | "delivery" | null;

function formatDateOnly(value: string | null | undefined) {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toLocaleDateString();
}

function isPastEvent(event: CalendarEventWithRelations, now = Date.now()) {
  const end = event.ends_at
    ? new Date(event.ends_at).getTime()
    : new Date(event.starts_at).getTime();
  return end < now;
}

function EditPencil({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      onClick={onClick}
      type="button"
    >
      <Pencil aria-hidden className="size-3.5" />
    </button>
  );
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
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">All events</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {upcoming.length} upcoming
              {past.length > 0 ? ` · ${past.length} past` : ""}
            </p>
          </div>
          <Button onClick={onClose} size="sm" type="button" variant="ghost">
            Close
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
          <p className="text-sm text-slate-600">Show past events</p>
          <button
            aria-checked={showPast}
            aria-label="Show past events"
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              showPast ? "bg-slate-800" : "bg-slate-300",
            )}
            onClick={() => setShowPast((current) => !current)}
            role="switch"
            type="button"
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow transition",
                showPast ? "left-[1.35rem]" : "left-0.5",
              )}
            />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3">
          {visible.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-900">
                {showPast ? "No events yet" : "No upcoming events"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {showPast
                  ? "Schedule an event to get started."
                  : "Turn on past events to see history, or schedule something new."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((event) => {
                const pastEvent = isPastEvent(event, now);
                return (
                  <li key={event.id}>
                    <button
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5 text-left transition hover:bg-slate-50",
                        pastEvent && "opacity-70",
                      )}
                      onClick={() => onSelect(event)}
                      type="button"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {event.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {new Date(event.starts_at).toLocaleString()}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[11px] font-medium",
                            eventTypeStyles[event.event_type] ??
                              eventTypeStyles.other,
                          )}
                        >
                          {calendarEventTypeLabel(event.event_type)}
                        </span>
                        {pastEvent ? (
                          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
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
  purchases,
}: ProjectDetailProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [priority, setPriority] = useState<ProjectPriority>(
    project.priority ?? "normal",
  );
  const [startedAt, setStartedAt] = useState(project.started_at ?? "");
  const [targetEndAt, setTargetEndAt] = useState(project.target_end_at ?? "");
  const [scope, setScope] = useState(project.scope ?? "");
  const [notes, setNotes] = useState(project.notes ?? "");
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [draftName, setDraftName] = useState(project.name);
  const [draftStatus, setDraftStatus] = useState<ProjectStatus>(project.status);
  const [draftPriority, setDraftPriority] = useState<ProjectPriority>(
    project.priority ?? "normal",
  );
  const [draftStartedAt, setDraftStartedAt] = useState(project.started_at ?? "");
  const [draftTargetEndAt, setDraftTargetEndAt] = useState(
    project.target_end_at ?? "",
  );
  const [draftScope, setDraftScope] = useState(project.scope ?? "");
  const [draftNotes, setDraftNotes] = useState(project.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventMode, setEventMode] = useState<"create" | "edit">("create");
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEventWithRelations | null>(null);

  useEffect(() => {
    setName(project.name);
    setStatus(project.status);
    setPriority(project.priority ?? "normal");
    setStartedAt(project.started_at ?? "");
    setTargetEndAt(project.target_end_at ?? "");
    setScope(project.scope ?? "");
    setNotes(project.notes ?? "");
  }, [project]);

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
  const pastTarget = isProjectPastTarget({
    ...project,
    target_end_at: targetEndAt || null,
    status,
  });

  function openEdit(section: Exclude<EditSection, null>) {
    setError(null);
    setDraftName(name);
    setDraftStatus(status);
    setDraftPriority(priority);
    setDraftStartedAt(startedAt);
    setDraftTargetEndAt(targetEndAt);
    setDraftScope(scope);
    setDraftNotes(notes);
    setEditSection(section);
  }

  async function saveProject(payload: ProjectInput) {
    setLoading(true);
    setError(null);

    const result = await updateProject(project.id, payload);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to save project.");
      return false;
    }

    setName(payload.name);
    setStatus(payload.status);
    setPriority(payload.priority);
    setStartedAt(payload.startedAt ?? "");
    setTargetEndAt(payload.targetEndAt ?? "");
    setScope(payload.scope ?? "");
    setNotes(payload.notes ?? "");
    setEditSection(null);
    router.refresh();
    return true;
  }

  async function onSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: ProjectInput = {
      name: editSection === "identity" ? draftName : name,
      status: editSection === "identity" ? draftStatus : status,
      priority: editSection === "identity" ? draftPriority : priority,
      startedAt:
        editSection === "schedule" ? draftStartedAt || undefined : startedAt || undefined,
      targetEndAt:
        editSection === "schedule"
          ? draftTargetEndAt || undefined
          : targetEndAt || undefined,
      scope: editSection === "delivery" ? draftScope || undefined : scope || undefined,
      notes: editSection === "delivery" ? draftNotes || undefined : notes || undefined,
    };

    await saveProject(payload);
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

  const editTitle =
    editSection === "identity"
      ? "Edit project"
      : editSection === "schedule"
        ? "Edit schedule"
        : editSection === "delivery"
          ? "Edit delivery"
          : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            href="/crm/projects"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to Projects
          </Link>
          <div className="mt-2 flex items-start gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {name}
            </h1>
            <EditPencil
              label="Edit project name, status, and priority"
              onClick={() => openEdit("identity")}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded border px-2.5 py-0.5 text-xs font-medium",
                statusStyles[status] ?? statusStyles.active,
              )}
            >
              {projectStatusLabel(status)}
            </span>
            <span
              className={cn(
                "inline-flex rounded border px-2.5 py-0.5 text-xs font-medium",
                priorityStyles[priority] ?? priorityStyles.normal,
              )}
            >
              {projectPriorityLabel(priority)}
            </span>
            {project.organizations ? (
              <Link
                className="rounded border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:border-slate-400"
                href={`/crm/organizations/${project.organizations.id}`}
              >
                {project.organizations.name}
              </Link>
            ) : null}
            {pastTarget ? (
              <span className="rounded border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Past target end
              </span>
            ) : null}
          </div>
        </div>
        <Button
          disabled={!lead}
          onClick={() => setReplyOpen(true)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Mail aria-hidden className="size-4" />
          Email
        </Button>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Next action
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-semibold text-slate-900",
              overdueAction && "text-red-700",
            )}
          >
            {resolvedNext.label || "Add a task or schedule an event"}
          </p>
          <p
            className={cn(
              "mt-1 text-xs text-slate-500",
              overdueAction && "font-medium text-red-700",
            )}
          >
            {resolvedNext.source
              ? resolvedNext.source === "task"
                ? "From task"
                : "From event"
              : "Auto from tasks & events"}
            {resolvedNext.at
              ? ` · ${formatDateOnly(resolvedNext.at)}`
              : ""}
            {overdueAction ? " · Overdue" : ""}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Open tasks
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {openTaskCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {tasks.length} total on this project
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Schedule
            </p>
            <EditPencil
              label="Edit project schedule"
              onClick={() => openEdit("schedule")}
            />
          </div>
          <dl className="mt-1 space-y-1 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-slate-500">Started</dt>
              <dd className="font-medium text-slate-900">
                {formatDateOnly(startedAt) ?? "Not set"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-slate-500">Target end</dt>
              <dd
                className={cn(
                  "font-medium text-slate-900",
                  pastTarget && "text-red-700",
                )}
              >
                {formatDateOnly(targetEndAt) ?? "Not set"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

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

        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden className="size-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Schedule & events
                </h2>
              </div>
            </div>

            {nextEvent ? (
              <button
                className="mt-3 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-white"
                onClick={() => openEditEvent(nextEvent)}
                type="button"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {upcoming[0] ? "Next up" : "Latest"}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {nextEvent.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {calendarEventTypeLabel(nextEvent.event_type)} ·{" "}
                  {new Date(nextEvent.starts_at).toLocaleDateString()}{" "}
                  {formatEventTime(nextEvent.starts_at)}
                </p>
              </button>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Nothing scheduled yet. Book the next touchpoint so delivery stays
                on rails.
              </p>
            )}

            {upcoming.length > 1 ? (
              <p className="mt-2 text-xs text-slate-500">
                +{upcoming.length - 1} more upcoming
              </p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={openCreateEvent} size="sm" type="button" variant="outline">
                <Plus aria-hidden className="size-4" />
                Schedule
              </Button>
              <Button
                onClick={() => setEventsOpen(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                View all
              </Button>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Delivery
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Scope of work and internal PM notes
                </p>
              </div>
              <EditPencil
                label="Edit delivery scope and notes"
                onClick={() => openEdit("delivery")}
              />
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Scope
                </p>
                {scope ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                    {scope}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">
                    No scope captured yet.
                  </p>
                )}
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Internal notes
                </p>
                {notes ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                    {notes}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">
                    No internal notes yet.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Stakeholders
            </h2>
            {lead ? (
              <dl className="mt-3 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Business</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {project.organizations ? (
                      <Link
                        className="hover:underline"
                        href={`/crm/organizations/${project.organizations.id}`}
                      >
                        {lead.business_name}
                      </Link>
                    ) : (
                      lead.business_name
                    )}
                  </dd>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">Contact</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">
                      {lead.contact_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Phone</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">
                      {lead.phone || "—"}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    <a
                      className="hover:underline"
                      href={`mailto:${lead.email}`}
                    >
                      {lead.email}
                    </a>
                  </dd>
                </div>
                {lead.message ? (
                  <div>
                    <dt className="text-xs text-slate-500">Original inquiry</dt>
                    <dd className="mt-0.5 line-clamp-4 whitespace-pre-wrap text-slate-700">
                      {lead.message}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No linked lead on this project.
              </p>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Purchases</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Spend tied to this engagement — promo, equipment, or supplies.
          </p>
        </div>
        <PurchasesPanel
          businesses={
            project.organizations
              ? [
                  {
                    id: project.organizations.id,
                    name: project.organizations.name,
                  },
                ]
              : []
          }
          defaults={{
            organizationId: project.organization_id,
            projectId: project.id,
          }}
          projects={[
            {
              id: project.id,
              name: project.name,
              organization_id: project.organization_id,
            },
          ]}
          rows={purchases}
          showLinks={false}
        />
      </section>

      {editSection ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <form
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
            onSubmit={onSaveEdit}
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {editTitle}
              </h2>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setEditSection(null)}
                type="button"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  {error}
                </div>
              ) : null}

              {editSection === "identity" ? (
                <>
                  <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                    Name
                    <input
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      onChange={(event) => setDraftName(event.target.value)}
                      required
                      value={draftName}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium text-slate-700">
                      Status
                      <select
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        onChange={(event) =>
                          setDraftStatus(event.target.value as ProjectStatus)
                        }
                        value={draftStatus}
                      >
                        {PROJECT_STATUSES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-slate-700">
                      Priority
                      <select
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        onChange={(event) =>
                          setDraftPriority(
                            event.target.value as ProjectPriority,
                          )
                        }
                        value={draftPriority}
                      >
                        {PROJECT_PRIORITIES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              ) : null}

              {editSection === "schedule" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Started
                    <input
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      onChange={(event) =>
                        setDraftStartedAt(event.target.value)
                      }
                      type="date"
                      value={draftStartedAt}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    Target end
                    <input
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      onChange={(event) =>
                        setDraftTargetEndAt(event.target.value)
                      }
                      type="date"
                      value={draftTargetEndAt}
                    />
                  </label>
                </div>
              ) : null}

              {editSection === "delivery" ? (
                <>
                  <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                    Scope
                    <textarea
                      className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      onChange={(event) => setDraftScope(event.target.value)}
                      placeholder="What this engagement covers."
                      value={draftScope}
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                    Internal notes
                    <textarea
                      className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      onChange={(event) => setDraftNotes(event.target.value)}
                      placeholder="Risks, blockers, handoff notes…"
                      value={draftNotes}
                    />
                  </label>
                </>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <Button
                onClick={() => setEditSection(null)}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={loading} size="sm" type="submit">
                {loading ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

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
