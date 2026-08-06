"use client";

import {
  ChevronRight,
  Mail,
  NotebookPen,
  Phone,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createActivity,
  deleteActivity,
} from "@/app/crm/activities/actions";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_TYPES,
  activityTypeLabel,
  emptyActivityFormValues,
  formatActivityWhen,
  type ActivityRow,
  type ActivityType,
  type EmailDirection,
} from "@/lib/activities";
import { cn } from "@/lib/utils";

const typeIcons: Record<ActivityType, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: UsersRound,
  note: NotebookPen,
  other: NotebookPen,
};

function activityKindLabel(activity: ActivityRow) {
  const type = activityTypeLabel(activity.activity_type);
  if (activity.activity_type !== "email") return type;
  const direction =
    (activity.email_direction ?? "sent") === "received" ? "Received" : "Sent";
  return `${type} · ${direction}`;
}

type ActivityPanelProps = {
  activities: ActivityRow[];
  organizationId?: string | null;
  leadId?: string | null;
  projectId?: string | null;
  compact?: boolean;
  readOnly?: boolean;
};

export function ActivityPanel({
  activities,
  organizationId = null,
  leadId = null,
  projectId = null,
  compact = false,
  readOnly = false,
}: ActivityPanelProps) {
  const router = useRouter();
  const [values, setValues] = useState(emptyActivityFormValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ActivityRow | null>(null);

  function updateField<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createActivity({
      organizationId,
      leadId,
      projectId,
      activityType: values.activityType,
      emailDirection:
        values.activityType === "email" ? values.emailDirection : null,
      subject: values.subject,
      body: values.body,
      occurredAt: values.occurredAt,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to log activity.");
      return;
    }

    setValues(emptyActivityFormValues());
    setShowForm(false);
    router.refresh();
  }

  async function onDelete(activity: ActivityRow) {
    const confirmed = window.confirm(
      "Delete this activity? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(activity.id);
    setError(null);

    const result = await deleteActivity(activity.id, {
      organizationId: activity.organization_id,
      leadId: activity.lead_id,
      projectId: activity.project_id,
    });

    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete activity.");
      return;
    }

    setSelected(null);
    router.refresh();
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-soft",
        compact ? "p-4" : "p-6",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
            Activity log
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Log emails, calls, meetings, and notes
            {projectId ? " for this project" : " for this workflow"}.
          </p>
        </div>
        {!readOnly ? (
          <Button
            onClick={() => {
              setError(null);
              setShowForm((current) => !current);
            }}
            type="button"
            variant="outline"
          >
            <Plus aria-hidden className="size-4" />
            {showForm ? "Cancel" : "Log activity"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      {!readOnly && showForm ? (
        <form
          className="mt-4 space-y-4 rounded-2xl border border-border bg-background p-4"
          onSubmit={onSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              Type
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField(
                    "activityType",
                    event.target.value as ActivityType,
                  )
                }
                value={values.activityType}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            {values.activityType === "email" ? (
              <label className="space-y-2 text-sm font-semibold">
                Direction
                <select
                  className="min-h-11 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField(
                      "emailDirection",
                      event.target.value as EmailDirection,
                    )
                  }
                  value={values.emailDirection}
                >
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
              </label>
            ) : (
              <label className="space-y-2 text-sm font-semibold">
                When
                <input
                  className="min-h-11 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField("occurredAt", event.target.value)
                  }
                  required
                  type="datetime-local"
                  value={values.occurredAt}
                />
              </label>
            )}
            {values.activityType === "email" ? (
              <label className="space-y-2 text-sm font-semibold sm:col-span-2">
                When
                <input
                  className="min-h-11 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField("occurredAt", event.target.value)
                  }
                  required
                  type="datetime-local"
                  value={values.occurredAt}
                />
              </label>
            ) : null}
          </div>
          <label className="block space-y-2 text-sm font-semibold">
            Subject
            <input
              className="min-h-11 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="Follow-up email to schedule consult"
              value={values.subject}
            />
          </label>
          <label className="block space-y-2 text-sm font-semibold">
            Details
            <textarea
              className="min-h-28 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => updateField("body", event.target.value)}
              placeholder="What was discussed, next steps, or outcome…"
              value={values.body}
            />
          </label>
          <Button disabled={loading} type="submit" variant="accent">
            {loading ? "Saving…" : "Save activity"}
          </Button>
        </form>
      ) : null}

      {activities.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="font-semibold">No activity logged yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Capture outreach, scheduling, consult notes, and proposal follow-up
            here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {activities.map((activity) => {
            const Icon = typeIcons[activity.activity_type] ?? NotebookPen;

            return (
              <li key={activity.id}>
                <button
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={() => setSelected(activity)}
                  type="button"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {activityKindLabel(activity)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatActivityWhen(activity.occurred_at)}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-3 sm:items-center sm:p-6">
          <div
            aria-modal="true"
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {activityKindLabel(selected)}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  {selected.subject || activityKindLabel(selected)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(selected.occurred_at).toLocaleString()}
                </p>
              </div>
              <Button
                onClick={() => setSelected(null)}
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </div>

            <div className="overflow-y-auto px-5 py-5">
              {selected.body ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {selected.body}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No details recorded for this activity.
                </p>
              )}
            </div>

            {!readOnly ? (
              <div className="border-t border-border px-5 py-4">
                <Button
                  disabled={deletingId === selected.id}
                  onClick={() => onDelete(selected)}
                  type="button"
                  variant="outline"
                >
                  <Trash2 aria-hidden className="size-4" />
                  {deletingId === selected.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
