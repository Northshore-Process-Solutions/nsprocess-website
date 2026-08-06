"use client";

import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { deleteOrganization } from "@/app/crm/actions";
import { CrmTable } from "@/components/admin/crm-table";
import { OrganizationForm } from "@/components/admin/organization-form";
import { Button } from "@/components/ui/button";
import { matchesCrmSearch, type CrmTableRow } from "@/lib/crm";

export function CrmPanel({ rows }: { rows: CrmTableRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<CrmTableRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesCrmSearch(row, query)),
    [rows, query],
  );

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
      `Delete ${row.name}? This removes the business and its linked primary contact.`,
    );

    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);

    const result = await deleteOrganization(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete business.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search businesses</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="min-h-11 w-full rounded-2xl border border-input bg-background py-3 pl-11 pr-4 text-base outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, contact, email, phone, category…"
            type="search"
            value={query}
          />
        </label>
        <Button
          className="shrink-0"
          onClick={openCreate}
          type="button"
          variant="accent"
        >
          <Plus aria-hidden className="size-4" />
          Add business
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <CrmTable
        deletingId={deletingId}
        emptyMessage={
          query.trim()
            ? "No businesses match your search."
            : "Use Add business to create your first vendor or customer record."
        }
        emptyTitle={query.trim() ? "No matches" : "No businesses yet"}
        onDelete={handleDelete}
        onEdit={openEdit}
        rows={filteredRows}
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
