"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";

import { deleteAgreement } from "@/app/crm/agreements/actions";
import { AgreementsTable } from "@/components/admin/agreements-table";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import type { AgreementWithItems } from "@/lib/agreements";

export function AgreementsPanel({
  rows,
  newHref,
  readOnly = false,
}: {
  rows: AgreementWithItems[];
  newHref?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { href } = usePortal();
  const createHref = newHref ?? href("/agreements/new");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(row: AgreementWithItems) {
    const confirmed = window.confirm(
      `Delete “${row.title}” (${row.agreement_number})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);
    const result = await deleteAgreement(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete agreement.");
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
              New agreement
            </Link>
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <AgreementsTable
        deletingId={deletingId}
        onDelete={readOnly ? undefined : handleDelete}
        rows={rows}
      />
    </div>
  );
}
