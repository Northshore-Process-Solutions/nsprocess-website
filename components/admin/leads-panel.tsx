"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteLead } from "@/app/admin/pipeline/actions";
import { LeadForm } from "@/components/admin/lead-form";
import { LeadsTable } from "@/components/admin/leads-table";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import type { LeadRow } from "@/lib/leads";

export function LeadsPanel({
  rows,
  activitiesByLeadId = {},
}: {
  rows: LeadRow[];
  activitiesByLeadId?: Record<string, ActivityRow[]>;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<LeadRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setMode("create");
    setSelectedRow(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: LeadRow) {
    setMode("edit");
    setSelectedRow(row);
    setError(null);
    setFormOpen(true);
  }

  async function handleDelete(row: LeadRow) {
    const confirmed = window.confirm(
      `Delete lead for ${row.business_name}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);

    const result = await deleteLead(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete lead.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Track each inquiry from first contact through consult, proposal,
          deposit, and project kickoff. Deposit received or project kickoff
          adds them to CRM as a customer.
        </p>
        <Button onClick={openCreate} type="button" variant="accent">
          <Plus aria-hidden className="size-4" />
          Add lead
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <LeadsTable
        deletingId={deletingId}
        onDelete={handleDelete}
        onEdit={openEdit}
        onError={(message) => setError(message)}
        onStageChanged={() => {
          setError(null);
          router.refresh();
        }}
        rows={rows}
      />

      <LeadForm
        activities={
          selectedRow ? (activitiesByLeadId[selectedRow.id] ?? []) : []
        }
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
