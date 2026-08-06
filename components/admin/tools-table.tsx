import { ExternalLink, Pencil, Trash2 } from "lucide-react";

import {
  MobileDataCard,
  MobileDataField,
  ResponsiveDataList,
} from "@/components/admin/responsive-data-list";
import { Button } from "@/components/ui/button";
import { formatBilling, type ToolRow } from "@/lib/tools";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  trial: "bg-sky-50 text-sky-800 border-sky-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
  replacing: "bg-amber-50 text-amber-900 border-amber-200",
};

type ToolsTableProps = {
  rows: ToolRow[];
  onEdit?: (row: ToolRow) => void;
  onDelete?: (row: ToolRow) => void;
  deletingId?: string | null;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        statusStyles[status] ?? statusStyles.inactive,
      )}
    >
      {status}
    </span>
  );
}

function RowActions({
  row,
  onEdit,
  onDelete,
  deletingId,
}: {
  row: ToolRow;
  onEdit?: (row: ToolRow) => void;
  onDelete?: (row: ToolRow) => void;
  deletingId: string | null;
}) {
  return (
    <>
      {onEdit ? (
        <Button
          aria-label={`Edit ${row.name}`}
          onClick={() => onEdit(row)}
          size="icon"
          type="button"
          variant="outline"
        >
          <Pencil aria-hidden className="size-4" />
        </Button>
      ) : null}
      {onDelete ? (
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
      ) : null}
    </>
  );
}

export function ToolsTable({
  rows,
  onEdit,
  onDelete,
  deletingId = null,
}: ToolsTableProps) {
  const showActions = Boolean(onEdit || onDelete);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No tools yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add Supabase, GitHub, Vercel, and other services your business depends
          on.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveDataList
      cards={rows.map((row) => (
        <MobileDataCard
          actions={
            showActions ? (
              <RowActions
                deletingId={deletingId}
                onDelete={onDelete}
                onEdit={onEdit}
                row={row}
              />
            ) : undefined
          }
          badge={<StatusBadge status={row.status} />}
          key={row.id}
          meta={
            <>
              {row.category ? <span>{row.category}</span> : null}
              <span>
                {formatBilling(row.billing_amount, row.billing_cadence)}
              </span>
            </>
          }
          subtitle={row.plan || undefined}
          title={row.name}
        >
          {row.account_email ? (
            <MobileDataField label="Account">
              {row.account_email}
            </MobileDataField>
          ) : null}
          {row.renewal_date ? (
            <MobileDataField label="Renewal">
              {row.renewal_date}
            </MobileDataField>
          ) : null}
          {row.website || row.admin_url ? (
            <MobileDataField label="Links">
              <span className="inline-flex flex-wrap justify-end gap-3">
                {row.website ? (
                  <a
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                    href={row.website}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Website
                    <ExternalLink aria-hidden className="size-3" />
                  </a>
                ) : null}
                {row.admin_url ? (
                  <a
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                    href={row.admin_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Admin
                    <ExternalLink aria-hidden className="size-3" />
                  </a>
                ) : null}
              </span>
            </MobileDataField>
          ) : null}
          {row.notes ? (
            <p className="text-muted-foreground">{row.notes}</p>
          ) : null}
        </MobileDataCard>
      ))}
      table={
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tool</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Billing</th>
                  <th className="px-4 py-3 font-semibold">Renewal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  {showActions ? (
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className="border-t border-border align-top transition hover:bg-secondary/40"
                    key={row.id}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">
                        {row.name}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs font-medium">
                        {row.website ? (
                          <a
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                            href={row.website}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Website
                            <ExternalLink aria-hidden className="size-3" />
                          </a>
                        ) : null}
                        {row.admin_url ? (
                          <a
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                            href={row.admin_url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Admin
                            <ExternalLink aria-hidden className="size-3" />
                          </a>
                        ) : null}
                      </div>
                      {row.account_email ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {row.account_email}
                        </p>
                      ) : null}
                      {row.notes ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                          {row.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {row.category || "—"}
                    </td>
                    <td className="px-4 py-4">{row.plan || "—"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatBilling(row.billing_amount, row.billing_cadence)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {row.renewal_date || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    {showActions ? (
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <RowActions
                            deletingId={deletingId}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            row={row}
                          />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  );
}
