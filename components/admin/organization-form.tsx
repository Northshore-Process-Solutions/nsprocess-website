"use client";

import { useState } from "react";

import {
  createOrganization,
  updateOrganization,
  type OrganizationInput,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  ORGANIZATION_STATUSES,
  RELATIONSHIP_TYPES,
  crmRowToFormValues,
  emptyCrmFormValues,
  type CrmTableRow,
} from "@/lib/crm";

type OrganizationFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: CrmTableRow | null;
  onClose: () => void;
  onSaved: () => void;
};

export function OrganizationForm({
  open,
  mode,
  initialRow,
  onClose,
  onSaved,
}: OrganizationFormProps) {
  if (!open) return null;

  return (
    <OrganizationFormDialog
      initialRow={initialRow}
      mode={mode}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function OrganizationFormDialog({
  mode,
  initialRow,
  onClose,
  onSaved,
}: Omit<OrganizationFormProps, "open">) {
  const [values, setValues] = useState(() =>
    mode === "edit" && initialRow
      ? crmRowToFormValues(initialRow)
      : emptyCrmFormValues(),
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

    const payload: OrganizationInput = {
      ...values,
      contactId: initialRow?.contactId ?? null,
    };

    const result =
      mode === "edit" && initialRow
        ? await updateOrganization(initialRow.id, payload)
        : await createOrganization(payload);

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
              {mode === "edit" ? "Edit organization" : "Add organization"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save the company record, relationship type, and primary contact.
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
              Organization name
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("name", event.target.value)}
                required
                value={values.name}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Relationship type
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField(
                    "relationshipType",
                    event.target.value as (typeof values)["relationshipType"],
                  )
                }
                value={values.relationshipType}
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
                {ORGANIZATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Category
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                value={values.category}
              />
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
              Organization email
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("email", event.target.value)}
                type="email"
                value={values.email}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              Organization phone
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("phone", event.target.value)}
                value={values.phone}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              City
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("city", event.target.value)}
                value={values.city}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold">
              State
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => updateField("state", event.target.value)}
                value={values.state}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Primary contact
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                First name
                <input
                  className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField("contactFirstName", event.target.value)
                  }
                  value={values.contactFirstName}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Last name
                <input
                  className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField("contactLastName", event.target.value)
                  }
                  value={values.contactLastName}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Contact email
                <input
                  className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField("contactEmail", event.target.value)
                  }
                  type="email"
                  value={values.contactEmail}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Contact phone
                <input
                  className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField("contactPhone", event.target.value)
                  }
                  value={values.contactPhone}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold sm:col-span-2">
                Title
                <input
                  className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    updateField("contactTitle", event.target.value)
                  }
                  value={values.contactTitle}
                />
              </label>
            </div>
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
                  : "Add organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
