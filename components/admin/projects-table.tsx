"use client";

import Link from "next/link";
import { CalendarDays, Eye } from "lucide-react";

import { ActionHoverTooltip } from "@/components/admin/action-hover-tooltip";
import { Button } from "@/components/ui/button";
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

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function ProjectViewAction({ row }: { row: ProjectWithOrganization }) {
  return (
    <ActionHoverTooltip
      content={
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Project preview
            </p>
            <p className="mt-1 text-base font-bold tracking-tight">{row.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {row.organizations?.name ?? "No organization"}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <PreviewField
              label="Status"
              value={
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                    statusStyles[row.status] ?? statusStyles.active,
                  )}
                >
                  {projectStatusLabel(row.status)}
                </span>
              }
            />
            <PreviewField
              label="Started"
              value={
                row.started_at
                  ? new Date(`${row.started_at}T12:00:00`).toLocaleDateString()
                  : "—"
              }
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Click to open project.
          </p>
        </>
      }
    >
      <Button
        asChild
        aria-label={`Open ${row.name}`}
        size="icon"
        type="button"
        variant="outline"
      >
        <Link href={`/admin/projects/${row.id}`}>
          <Eye aria-hidden className="size-4" />
        </Link>
      </Button>
    </ActionHoverTooltip>
  );
}

function ProjectCalendarAction({ row }: { row: ProjectWithOrganization }) {
  const href = row.lead_id
    ? `/admin/calendar?leadId=${row.lead_id}`
    : "/admin/calendar";

  return (
    <ActionHoverTooltip
      content={
        <p className="text-sm text-muted-foreground">
          View this project&apos;s events on the calendar.
        </p>
      }
      width={220}
    >
      <Button
        asChild
        aria-label={`Calendar for ${row.name}`}
        size="icon"
        type="button"
        variant="outline"
      >
        <Link href={href}>
          <CalendarDays aria-hidden className="size-4" />
        </Link>
      </Button>
    </ActionHoverTooltip>
  );
}

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
                  <div className="font-semibold text-foreground">{row.name}</div>
                  {row.notes ? (
                    <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                      {row.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 font-medium">
                  {row.organizations?.name ?? "—"}
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
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <ProjectCalendarAction row={row} />
                    <ProjectViewAction row={row} />
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
