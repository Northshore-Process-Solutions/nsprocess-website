"use client";

import { useState } from "react";

import {
  createTool,
  updateTool,
  type ToolInput,
} from "@/app/admin/tools/actions";
import { Button } from "@/components/ui/button";
import {
  BILLING_CADENCES,
  TOOL_STATUSES,
  emptyToolFormValues,
  toolRowToFormValues,
  type ToolRow,
} from "@/lib/tools";

type ToolFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: ToolRow | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ToolForm({
  open,
  mode,
  initialRow,
  onClose,
  onSaved,
}: ToolFormProps) {
  if (!open) return null;

  return (
    <ToolFormDialog
      initialRow={initialRow}
      mode={mode}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function ToolFormDialog({
  mode,
  initialRow,
  onClose,
  onSaved,
}: Omit<ToolFormProps, "open">) {
  const [values, setValues] = useState(() =>
    mode === "edit" && initialRow
      ? toolRowToFormValues(initialRow)
      : emptyToolFormValues(),
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

    const payload: ToolInput = { ...values };

    const result =
      mode === "edit" && initialRow
        ? await updateTool(initialRow.id, payload)
        : await createTool(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/40 p-4 sm:items-center">
      <div
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "edit" ? "Edit tool" : "Add tool"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Track the software and services North Shore Process Solutions
              depends on.
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Name
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("name", event.target.value)}
                required
                value={values.name}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Category
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                placeholder="Hosting, Auth, Email"
                value={values.category}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Status
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as (typeof values)["status"],
                  )
                }
                value={values.status}
              >
                {TOOL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Website
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://"
                value={values.website}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Admin URL
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("adminUrl", event.target.value)
                }
                placeholder="https://dashboard..."
                value={values.adminUrl}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Account email
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("accountEmail", event.target.value)
                }
                type="email"
                value={values.accountEmail}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Plan
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("plan", event.target.value)}
                value={values.plan}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Billing amount
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                min="0"
                onChange={(event) =>
                  updateField("billingAmount", event.target.value)
                }
                placeholder="20.00"
                step="0.01"
                type="number"
                value={values.billingAmount}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Billing cadence
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField(
                    "billingCadence",
                    event.target.value as (typeof values)["billingCadence"],
                  )
                }
                value={values.billingCadence}
              >
                {BILLING_CADENCES.map((cadence) => (
                  <option key={cadence} value={cadence}>
                    {cadence.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Renewal date
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("renewalDate", event.target.value)
                }
                type="date"
                value={values.renewalDate}
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold">
            Notes
            <textarea
              className="min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => updateField("notes", event.target.value)}
              value={values.notes}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={loading} type="submit" variant="accent">
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Save changes"
                  : "Add tool"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
