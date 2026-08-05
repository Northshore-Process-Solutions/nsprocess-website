"use client";

import { useState } from "react";

import {
  createPurchase,
  updatePurchase,
  type PurchaseInput,
} from "@/app/admin/purchases/actions";
import { Button } from "@/components/ui/button";
import {
  emptyPurchaseFormValues,
  purchaseRowToFormValues,
  PURCHASE_TYPES,
  type PurchaseRow,
} from "@/lib/purchases";

export type PurchaseBusinessOption = {
  id: string;
  name: string;
};

export type PurchaseProjectOption = {
  id: string;
  name: string;
  organization_id: string | null;
};

type PurchaseFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: PurchaseRow | null;
  businesses: PurchaseBusinessOption[];
  projects: PurchaseProjectOption[];
  defaults?: {
    organizationId?: string | null;
    projectId?: string | null;
  };
  onClose: () => void;
  onSaved: () => void;
};

export function PurchaseForm({
  open,
  mode,
  initialRow,
  businesses,
  projects,
  defaults,
  onClose,
  onSaved,
}: PurchaseFormProps) {
  if (!open) return null;

  return (
    <PurchaseFormDialog
      businesses={businesses}
      defaults={defaults}
      initialRow={initialRow}
      key={`${mode}-${initialRow?.id ?? "new"}`}
      mode={mode}
      onClose={onClose}
      onSaved={onSaved}
      projects={projects}
    />
  );
}

function PurchaseFormDialog({
  mode,
  initialRow,
  businesses,
  projects,
  defaults,
  onClose,
  onSaved,
}: Omit<PurchaseFormProps, "open">) {
  const [values, setValues] = useState(() =>
    mode === "edit" && initialRow
      ? purchaseRowToFormValues(initialRow)
      : emptyPurchaseFormValues(defaults),
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

    const payload: PurchaseInput = {
      name: values.name,
      purchaseType: values.purchaseType,
      amount: values.amount,
      purchasedAt: values.purchasedAt,
      quantity: values.quantity || undefined,
      organizationId: values.organizationId || null,
      projectId: values.projectId || null,
      notes: values.notes || undefined,
    };

    const result =
      mode === "edit" && initialRow
        ? await updatePurchase(initialRow.id, payload)
        : await createPurchase(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
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
              {mode === "edit" ? "Edit purchase" : "Add purchase"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Track promo materials, equipment, and project-specific spend.
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
            Name
            <input
              className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Yard signs, laptop stand, client workbook print…"
              required
              value={values.name}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              Type
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField(
                    "purchaseType",
                    event.target.value as typeof values.purchaseType,
                  )
                }
                value={values.purchaseType}
              >
                {PURCHASE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Amount
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                inputMode="decimal"
                min="0"
                onChange={(event) => updateField("amount", event.target.value)}
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={values.amount}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Purchased
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("purchasedAt", event.target.value)
                }
                required
                type="date"
                value={values.purchasedAt}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Quantity
              <input
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                inputMode="decimal"
                min="0"
                onChange={(event) =>
                  updateField("quantity", event.target.value)
                }
                step="1"
                type="number"
                value={values.quantity}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Business
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) =>
                  updateField("organizationId", event.target.value)
                }
                value={values.organizationId}
              >
                <option value="">General / not linked</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Project
              <select
                className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => {
                  const projectId = event.target.value;
                  const project = projects.find((item) => item.id === projectId);
                  updateField("projectId", projectId);
                  if (project?.organization_id) {
                    updateField("organizationId", project.organization_id);
                  }
                }}
                value={values.projectId}
              >
                <option value="">None / business-level</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold">
            Notes
            <textarea
              className="min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Vendor, where stored, why purchased…"
              value={values.notes}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={loading} type="submit" variant="accent">
              {loading
                ? "Saving…"
                : mode === "edit"
                  ? "Save changes"
                  : "Add purchase"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
