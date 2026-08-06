"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteTool } from "@/app/crm/tools/actions";
import { ToolForm } from "@/components/admin/tool-form";
import { ToolsTable } from "@/components/admin/tools-table";
import { Button } from "@/components/ui/button";
import type { ToolRow } from "@/lib/tools";

export function ToolsPanel({
  rows,
  readOnly = false,
}: {
  rows: ToolRow[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<ToolRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setMode("create");
    setSelectedRow(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: ToolRow) {
    setMode("edit");
    setSelectedRow(row);
    setError(null);
    setFormOpen(true);
  }

  async function handleDelete(row: ToolRow) {
    const confirmed = window.confirm(
      `Delete ${row.name} from your internal stack list?`,
    );
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);

    const result = await deleteTool(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete tool.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Track software, hosting, and services your business depends on.
        </p>
        {!readOnly ? (
          <Button onClick={openCreate} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            Add tool
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <ToolsTable
        deletingId={deletingId}
        onDelete={readOnly ? undefined : handleDelete}
        onEdit={readOnly ? undefined : openEdit}
        rows={rows}
      />

      {!readOnly ? (
        <ToolForm
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
      ) : null}
    </div>
  );
}
