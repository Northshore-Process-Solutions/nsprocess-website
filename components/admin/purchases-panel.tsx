"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletePurchase } from "@/app/admin/purchases/actions";
import {
  PurchaseForm,
  type PurchaseBusinessOption,
  type PurchaseProjectOption,
} from "@/components/admin/purchase-form";
import { PurchasesTable } from "@/components/admin/purchases-table";
import { Button } from "@/components/ui/button";
import type { PurchaseWithRelations } from "@/lib/purchases";

export function PurchasesPanel({
  rows,
  businesses,
  projects,
  defaults,
  showLinks = true,
}: {
  rows: PurchaseWithRelations[];
  businesses: PurchaseBusinessOption[];
  projects: PurchaseProjectOption[];
  defaults?: {
    organizationId?: string | null;
    projectId?: string | null;
  };
  showLinks?: boolean;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] =
    useState<PurchaseWithRelations | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setMode("create");
    setSelectedRow(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: PurchaseWithRelations) {
    setMode("edit");
    setSelectedRow(row);
    setError(null);
    setFormOpen(true);
  }

  async function handleDelete(row: PurchaseWithRelations) {
    const confirmed = window.confirm(
      `Delete “${row.name}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);

    const result = await deletePurchase(row.id, {
      organizationId: row.organization_id,
      projectId: row.project_id,
    });
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete purchase.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} type="button" variant="accent">
          <Plus aria-hidden className="size-4" />
          Add purchase
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <PurchasesTable
        deletingId={deletingId}
        onDelete={handleDelete}
        onEdit={openEdit}
        rows={rows}
        showLinks={showLinks}
      />

      <PurchaseForm
        businesses={businesses}
        defaults={defaults}
        initialRow={selectedRow}
        mode={mode}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
        open={formOpen}
        projects={projects}
      />
    </div>
  );
}
