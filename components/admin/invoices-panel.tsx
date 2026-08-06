"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";

import { deleteInvoice } from "@/app/crm/invoices/actions";
import { InvoicesTable } from "@/components/admin/invoices-table";
import { Button } from "@/components/ui/button";
import type { InvoiceWithItems } from "@/lib/invoices";

export function InvoicesPanel({
  rows,
  newHref = "/crm/invoices/new",
}: {
  rows: InvoiceWithItems[];
  newHref?: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(row: InvoiceWithItems) {
    const confirmed = window.confirm(
      `Delete “${row.title}” (${row.invoice_number})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);
    const result = await deleteInvoice(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete invoice.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild variant="accent">
          <Link href={newHref}>
            <Plus aria-hidden className="size-4" />
            New invoice
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <InvoicesTable
        deletingId={deletingId}
        onDelete={handleDelete}
        rows={rows}
      />
    </div>
  );
}
