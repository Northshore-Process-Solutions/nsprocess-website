"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

import {
  createLead,
  updateLead,
  type LeadInput,
} from "@/app/crm/pipeline/actions";
import { ActivityPanel } from "@/components/admin/activity-panel";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import {
  LEAD_SOURCES,
  LEAD_STAGES,
  emptyLeadFormValues,
  leadRowToFormValues,
  type LeadRow,
} from "@/lib/leads";

type LeadFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: LeadRow | null;
  activities?: ActivityRow[];
  onClose: () => void;
  onSaved: () => void;
  onReply?: (lead: LeadRow) => void;
};

export function LeadForm({
  open,
  mode,
  initialRow,
  activities = [],
  onClose,
  onSaved,
  onReply,
}: LeadFormProps) {
  if (!open) return null;

  return (
    <LeadFormDialog
      activities={activities}
      initialRow={initialRow}
      mode={mode}
      onClose={onClose}
      onReply={onReply}
      onSaved={onSaved}
    />
  );
}

function LeadFormDialog({
  mode,
  initialRow,
  activities = [],
  onClose,
  onSaved,
  onReply,
}: Omit<LeadFormProps, "open">) {
  const [values, setValues] = useState(() =>
    mode === "edit" && initialRow
      ? leadRowToFormValues(initialRow)
      : emptyLeadFormValues(),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    const payload: LeadInput = { ...values };
    const result =
      mode === "edit" && initialRow
        ? await updateLead(initialRow.id, payload)
        : await createLead(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/40 p-0 sm:items-center sm:p-4">
      <div
        aria-modal="true"
        className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-card sm:max-h-[90vh] sm:rounded-3xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {mode === "edit" ? "Edit lead" : "Add lead"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
              Track Free Process Review inquiries through your pipeline.
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={onSubmit}
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              Business name
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("businessName", event.target.value)
                }
                required
                value={values.businessName}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Contact name
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("contactName", event.target.value)
                }
                required
                value={values.contactName}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Email
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("email", event.target.value)}
                required
                type="email"
                value={values.email}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Phone
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="(978) 555-0123"
                value={values.phone}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Title
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("title", event.target.value)}
                value={values.title}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Source
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField(
                    "source",
                    event.target.value as (typeof values)["source"],
                  )
                }
                value={values.source}
              >
                {LEAD_SOURCES.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Stage
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField(
                    "stage",
                    event.target.value as (typeof values)["stage"],
                  )
                }
                value={values.stage}
              >
                {LEAD_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Next follow-up
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("nextFollowUpAt", event.target.value)
                }
                type="date"
                value={values.nextFollowUpAt}
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold">
            Inquiry message
            <textarea
              className="min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => updateField("message", event.target.value)}
              value={values.message}
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold">
            Internal notes
            <textarea
              className="min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => updateField("notes", event.target.value)}
              value={values.notes}
            />
          </label>

          {values.stage === "lost" ? (
            <label className="block space-y-2 text-sm font-semibold">
              Lost reason
              <textarea
                className="min-h-20 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("lostReason", event.target.value)
                }
                required
                value={values.lostReason}
              />
            </label>
          ) : null}

          <div className="hidden flex-col-reverse gap-3 sm:flex sm:flex-row sm:justify-between">
            {mode === "edit" && initialRow && onReply ? (
              <Button
                onClick={() => onReply(initialRow)}
                type="button"
                variant="outline"
              >
                <Mail aria-hidden className="size-4" />
                Reply by email
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={onClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={loading} type="submit" variant="accent">
                {loading
                  ? "Saving..."
                  : mode === "edit"
                    ? "Save changes"
                    : "Add lead"}
              </Button>
            </div>
          </div>

        {mode === "edit" && initialRow ? (
          <div className="border-t border-border pt-6">
            <ActivityPanel
              activities={activities}
              compact
              leadId={initialRow.id}
              organizationId={initialRow.organization_id}
            />
          </div>
        ) : null}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-card px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden">
            <Button disabled={loading} type="submit" variant="accent">
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Save changes"
                  : "Add lead"}
            </Button>
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
