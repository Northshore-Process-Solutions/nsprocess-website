"use client";

import Link from "next/link";
import { FileText, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatProposalMoney,
  proposalStatusLabel,
  type ProposalWithItems,
} from "@/lib/proposals";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-amber-50 text-amber-900 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  declined: "bg-red-50 text-red-800 border-red-200",
  expired: "bg-stone-100 text-stone-700 border-stone-200",
};

type ProposalsTableProps = {
  rows: ProposalWithItems[];
  onDelete: (row: ProposalWithItems) => void;
  deletingId?: string | null;
};

export function ProposalsTable({
  rows,
  onDelete,
  deletingId = null,
}: ProposalsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No proposals yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Draft a proposal after a consult, then print the PDF for the client.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Proposal</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Issued</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-t border-border align-top transition hover:bg-secondary/40"
                key={row.id}
              >
                <td className="px-4 py-4">
                  <Link
                    className="font-semibold text-accent hover:underline"
                    href={`/crm/proposals/${row.id}`}
                  >
                    {row.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.proposal_number}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium">{row.client_business_name}</div>
                  {row.client_contact_name ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.client_contact_name}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      statusStyles[row.status] ?? statusStyles.draft,
                    )}
                  >
                    {proposalStatusLabel(row.status)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap font-medium">
                  {formatProposalMoney(row.total_amount)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                  {new Date(`${row.issued_at}T12:00:00`).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <Button asChild size="icon" variant="outline">
                      <Link
                        aria-label={`Edit ${row.title}`}
                        href={`/crm/proposals/${row.id}`}
                      >
                        <Pencil aria-hidden className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild size="icon" variant="outline">
                      <Link
                        aria-label={`Open PDF for ${row.title}`}
                        href={`/crm/proposals/${row.id}/pdf`}
                        target="_blank"
                      >
                        <FileText aria-hidden className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      aria-label={`Delete ${row.title}`}
                      disabled={deletingId === row.id}
                      onClick={() => onDelete(row)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
