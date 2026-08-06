"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";

import { deleteInvoice } from "@/app/crm/invoices/actions";
import { InvoicesTable } from "@/components/admin/invoices-table";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import type { InvoiceWithItems } from "@/lib/invoices";

export function InvoicesPanel({
  rows,
  newHref,
  readOnly = false,
}: {
  rows: InvoiceWithItems[];
  newHref?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { href } = usePortal();
  const createHref = newHref ?? href("/invoices/new");
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
      {!readOnly ? (
        <div className="flex justify-end">
          <Button asChild variant="accent">
            <Link href={createHref}>
              <Plus aria-hidden className="size-4" />
              New invoice
            </Link>
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <InvoicesTable
        deletingId={deletingId}
        onDelete={readOnly ? undefined : handleDelete}
        rows={rows}
      />
    </div>
  );
}
