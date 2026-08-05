import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { relationshipTypeLabel, type CrmTableRow } from "@/lib/crm";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  prospect: "bg-sky-50 text-sky-800 border-sky-200",
  do_not_use: "bg-red-50 text-red-800 border-red-200",
};

type CrmTableProps = {
  rows: CrmTableRow[];
  onEdit: (row: CrmTableRow) => void;
  onDelete: (row: CrmTableRow) => void;
  deletingId?: string | null;
  emptyTitle?: string;
  emptyMessage?: string;
};

export function CrmTable({
  rows,
  onEdit,
  onDelete,
  deletingId = null,
  emptyTitle = "No businesses yet",
  emptyMessage = "Use Add business to create your first vendor or customer record.",
}: CrmTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Primary contact</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Category</th>
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
                  <div className="flex flex-col items-start gap-1">
                    <Link
                      className="font-semibold text-foreground transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={`/admin/organizations/${row.id}`}
                    >
                      {row.name}
                    </Link>
                    {row.website ? (
                      <a
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        href={row.website}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Website
                        <ExternalLink aria-hidden className="size-3" />
                      </a>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {row.relationshipTypes.length > 0 ? (
                      row.relationshipTypes.map((type) => (
                        <span
                          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                          key={type}
                        >
                          {relationshipTypeLabel(type)}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium">
                    {row.primaryContact || "—"}
                  </div>
                  {row.contactTitle ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {row.contactTitle}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  {row.email ? (
                    <a
                      className="text-accent hover:underline"
                      href={`mailto:${row.email}`}
                    >
                      {row.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.phone || "—"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
                      statusStyles[row.status] ?? statusStyles.inactive,
                    )}
                  >
                    {row.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {row.category || "—"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <Button
                      aria-label={`Edit ${row.name}`}
                      onClick={() => onEdit(row)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button
                      aria-label={`Delete ${row.name}`}
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
