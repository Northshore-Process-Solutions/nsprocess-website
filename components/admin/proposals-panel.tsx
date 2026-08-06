"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";

import { deleteProposal } from "@/app/crm/proposals/actions";
import { ProposalsTable } from "@/components/admin/proposals-table";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import type { ProposalWithItems } from "@/lib/proposals";

export function ProposalsPanel({
  rows,
  newHref,
  readOnly = false,
}: {
  rows: ProposalWithItems[];
  newHref?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { href } = usePortal();
  const createHref = newHref ?? href("/proposals/new");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(row: ProposalWithItems) {
    const confirmed = window.confirm(
      `Delete “${row.title}” (${row.proposal_number})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);
    const result = await deleteProposal(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete proposal.");
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
              New proposal
            </Link>
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <ProposalsTable
        deletingId={deletingId}
        onDelete={readOnly ? undefined : handleDelete}
        rows={rows}
      />
    </div>
  );
}
