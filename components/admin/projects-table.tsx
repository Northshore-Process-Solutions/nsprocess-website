"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Eye } from "lucide-react";

import { ActionHoverTooltip } from "@/components/admin/action-hover-tooltip";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import {
  isNextActionOverdue,
  isProjectPastTarget,
  PROJECT_STATUSES,
  projectPriorityLabel,
  projectStatusLabel,
  type ProjectStatus,
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

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  normal: "bg-sky-50 text-sky-800 border-sky-200",
  high: "bg-red-50 text-red-800 border-red-200",
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
  const { href } = usePortal();
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
              {row.organizations?.name ?? "No business"}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <PreviewField
              label="Status"
              value={projectStatusLabel(row.status)}
            />
            <PreviewField
              label="Priority"
              value={projectPriorityLabel(row.priority)}
            />
            <PreviewField
              label="Next action"
              value={row.next_action || "—"}
            />
            <PreviewField
              label="Source"
              value={
                row.next_action_source === "task"
                  ? "Task"
                  : row.next_action_source === "event"
                    ? "Event"
                    : "—"
              }
            />
            <PreviewField
              label="Open tasks"
              value={String(row.open_task_count ?? 0)}
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
        <Link href={href(`/projects/${row.id}`)}>
          <Eye aria-hidden className="size-4" />
        </Link>
      </Button>
    </ActionHoverTooltip>
  );
}

function ProjectCalendarAction({ row }: { row: ProjectWithOrganization }) {
  const { href } = usePortal();
  const calendarHref = row.lead_id
    ? href(`/calendar?leadId=${row.lead_id}`)
    : href("/calendar");

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
        <Link href={calendarHref}>
          <CalendarDays aria-hidden className="size-4" />
        </Link>
      </Button>
    </ActionHoverTooltip>
  );
}

export function ProjectsTable({ rows }: ProjectsTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>(
    "all",
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            statusFilter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-secondary",
          )}
          onClick={() => setStatusFilter("all")}
          type="button"
        >
          All ({rows.length})
        </button>
        {PROJECT_STATUSES.map((status) => {
          const count = rows.filter((row) => row.status === status.value).length;
          return (
            <button
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                statusFilter === status.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              type="button"
            >
              {status.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-semibold">No projects in this status</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Next action</th>
                  <th className="px-4 py-3 font-semibold">Tasks</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const overdueAction = isNextActionOverdue(row);
                  const pastTarget = isProjectPastTarget(row);

                  return (
                    <tr
                      className="border-t border-border align-top transition hover:bg-secondary/40"
                      key={row.id}
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground">
                          {row.name}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.organizations?.name ?? "—"}
                          {pastTarget ? " · Past target end" : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                            priorityStyles[row.priority] ??
                              priorityStyles.normal,
                          )}
                        >
                          {projectPriorityLabel(row.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className={cn(
                            "font-medium",
                            overdueAction && "text-red-700",
                          )}
                        >
                          {row.next_action || "—"}
                        </div>
                        <p
                          className={cn(
                            "mt-1 text-xs text-muted-foreground",
                            overdueAction && "font-semibold text-red-700",
                          )}
                        >
                          {row.next_action_source === "task"
                            ? "Task"
                            : row.next_action_source === "event"
                              ? "Event"
                              : null}
                          {row.next_action_source && row.next_action_at
                            ? " · "
                            : null}
                          {row.next_action_at
                            ? new Date(
                                `${row.next_action_at}T12:00:00`,
                              ).toLocaleDateString()
                            : row.next_action
                              ? "No date"
                              : "Add a task or event"}
                          {overdueAction ? " · Overdue" : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {row.open_task_count ?? 0} open
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
