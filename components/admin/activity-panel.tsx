"use client";

import {
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
    const confirmed = window.confirm("Delete this activity? This cannot be undone.");
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
        <form className="mt-4 space-y-4 rounded-2xl border border-border bg-background p-4" onSubmit={onSubmit}>
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
        <ul className="mt-4 space-y-3">
          {activities.map((activity) => {
            const Icon = typeIcons[activity.activity_type] ?? NotebookPen;

            return (
              <li
                className="rounded-2xl border border-border bg-background p-4"
                key={activity.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-accent">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {activityTypeLabel(activity.activity_type)}
                          {activity.activity_type === "email"
                            ? ` · ${
                                (activity.email_direction ?? "sent") ===
                                "received"
                                  ? "Received"
                                  : "Sent"
                              }`
                            : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.occurred_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold">
                        {activity.subject || activityTypeLabel(activity.activity_type)}
                      </p>
                      {activity.body ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {activity.body}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {!readOnly ? (
                    <Button
                      aria-label="Delete activity"
                      disabled={deletingId === activity.id}
                      onClick={() => onDelete(activity)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
