import { ExternalLink } from "lucide-react";

import type { CrmTableRow } from "@/lib/crm";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  prospect: "bg-sky-50 text-sky-800 border-sky-200",
  do_not_use: "bg-red-50 text-red-800 border-red-200",
};

export function CrmTable({ rows }: { rows: CrmTableRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No organizations yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add vendors or customer contacts in Supabase to see them here.
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
              <th className="px-4 py-3 font-semibold">Organization</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Primary contact</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-t border-border align-top transition hover:bg-secondary/40"
                key={row.id}
              >
                <td className="px-4 py-4">
                  <div className="font-semibold text-foreground">{row.name}</div>
                  {row.website ? (
                    <a
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                      href={row.website}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Website
                      <ExternalLink aria-hidden className="size-3" />
                    </a>
                  ) : null}
                  {row.notes ? (
                    <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                      {row.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {row.relationshipTypes.length > 0 ? (
                      row.relationshipTypes.map((type) => (
                        <span
                          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground"
                          key={type}
                        >
                          {type}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
