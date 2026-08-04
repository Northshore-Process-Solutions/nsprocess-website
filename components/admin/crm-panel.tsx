"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteOrganization } from "@/app/admin/actions";
import { CrmTable } from "@/components/admin/crm-table";
import { OrganizationForm } from "@/components/admin/organization-form";
import { Button } from "@/components/ui/button";
import type { CrmTableRow } from "@/lib/crm";

export function CrmPanel({ rows }: { rows: CrmTableRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<CrmTableRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setMode("create");
    setSelectedRow(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: CrmTableRow) {
    setMode("edit");
    setSelectedRow(row);
    setError(null);
    setFormOpen(true);
  }

  async function handleDelete(row: CrmTableRow) {
    const confirmed = window.confirm(
      `Delete ${row.name}? This removes the organization and its linked primary contact.`,
    );

    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);

    const result = await deleteOrganization(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete organization.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Add, edit, or delete organizations directly from this table.
        </p>
        <Button onClick={openCreate} type="button" variant="accent">
          <Plus aria-hidden className="size-4" />
          Add organization
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <CrmTable
        deletingId={deletingId}
        onDelete={handleDelete}
        onEdit={openEdit}
        rows={rows}
      />

      <OrganizationForm
        initialRow={selectedRow}
        key={`${mode}-${selectedRow?.id ?? "new"}-${formOpen ? "open" : "closed"}`}
        mode={mode}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
        open={formOpen}
      />
    </div>
  );
}
