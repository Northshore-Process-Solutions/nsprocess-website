import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatPurchaseAmount,
  purchaseTypeLabel,
  type PurchaseWithRelations,
} from "@/lib/purchases";
import { cn } from "@/lib/utils";

const typeStyles: Record<string, string> = {
  promo: "bg-violet-50 text-violet-800 border-violet-200",
  equipment: "bg-sky-50 text-sky-800 border-sky-200",
  supplies: "bg-amber-50 text-amber-900 border-amber-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

type PurchasesTableProps = {
  rows: PurchaseWithRelations[];
  onEdit: (row: PurchaseWithRelations) => void;
  onDelete: (row: PurchaseWithRelations) => void;
  deletingId?: string | null;
  showLinks?: boolean;
};

export function PurchasesTable({
  rows,
  onEdit,
  onDelete,
  deletingId = null,
  showLinks = true,
}: PurchasesTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No purchases yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Log promo materials, equipment, and project-specific spend here.
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
              <th className="px-4 py-3 font-semibold">Purchase</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              {showLinks ? (
                <>
                  <th className="px-4 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Project</th>
                </>
              ) : null}
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
                  <div className="font-semibold">{row.name}</div>
                  {row.quantity !== null && row.quantity !== undefined ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Qty {row.quantity}
                    </p>
                  ) : null}
                  {row.notes ? (
                    <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                      {row.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      typeStyles[row.purchase_type] ?? typeStyles.other,
                    )}
                  >
                    {purchaseTypeLabel(row.purchase_type)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap font-medium">
                  {formatPurchaseAmount(row.amount)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                  {new Date(`${row.purchased_at}T12:00:00`).toLocaleDateString()}
                </td>
                {showLinks ? (
                  <>
                    <td className="px-4 py-4">
                      {row.organizations ? (
                        <Link
                          className="font-medium text-accent hover:underline"
                          href={`/crm/organizations/${row.organizations.id}`}
                        >
                          {row.organizations.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {row.projects ? (
                        <Link
                          className="font-medium text-accent hover:underline"
                          href={`/crm/projects/${row.projects.id}`}
                        >
                          {row.projects.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </>
                ) : null}
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
