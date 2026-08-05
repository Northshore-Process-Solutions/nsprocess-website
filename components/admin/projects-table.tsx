import Link from "next/link";

import {
  projectStatusLabel,
  type ProjectWithOrganization,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  planning: "bg-sky-50 text-sky-800 border-sky-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-900 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

type ProjectsTableProps = {
  rows: ProjectWithOrganization[];
};

export function ProjectsTable({ rows }: ProjectsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No projects yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When a Pipeline lead reaches deposit received, a project is created
          here automatically.
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
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Organization</th>
              <th className="px-4 py-3 font-semibold">Started</th>
              <th className="px-4 py-3 font-semibold">Status</th>
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
                    className="font-semibold text-foreground hover:text-accent hover:underline"
                    href={`/admin/projects/${row.id}`}
                  >
                    {row.name}
                  </Link>
                  {row.notes ? (
                    <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                      {row.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  {row.organizations ? (
                    <Link
                      className="font-medium text-accent hover:underline"
                      href={`/admin/organizations/${row.organizations.id}`}
                    >
                      {row.organizations.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                  {row.started_at
                    ? new Date(`${row.started_at}T12:00:00`).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      statusStyles[row.status] ?? statusStyles.active,
                    )}
                  >
                    {projectStatusLabel(row.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
