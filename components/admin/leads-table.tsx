"use client";

import Link from "next/link";
import { Building2, Pencil, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

import {
  convertWonLeadToCrm,
  updateLeadStage,
} from "@/app/admin/pipeline/actions";
import { Button } from "@/components/ui/button";
import {
  LEAD_STAGES,
  leadSourceLabel,
  type LeadRow,
  type LeadStage,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

const stageStyles: Record<LeadStage, string> = {
  new_inquiry: "bg-sky-50 text-sky-800 border-sky-200",
  review_booked: "bg-indigo-50 text-indigo-800 border-indigo-200",
  review_completed: "bg-violet-50 text-violet-800 border-violet-200",
  proposal_sent: "bg-amber-50 text-amber-900 border-amber-200",
  won: "bg-emerald-50 text-emerald-800 border-emerald-200",
  lost: "bg-red-50 text-red-800 border-red-200",
};

type LeadsTableProps = {
  rows: LeadRow[];
  onEdit: (row: LeadRow) => void;
  onDelete: (row: LeadRow) => void;
  deletingId?: string | null;
  onStageChanged: () => void;
  onError?: (message: string) => void;
};

export function LeadsTable({
  rows,
  onEdit,
  onDelete,
  deletingId = null,
  onStageChanged,
  onError,
}: LeadsTableProps) {
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No leads in this stage</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Website Process Review requests and manual leads will show up here.
        </p>
      </div>
    );
  }

  async function handleStageChange(leadId: string, stage: LeadStage) {
    setStageUpdatingId(leadId);
    const result = await updateLeadStage(leadId, stage);
    setStageUpdatingId(null);

    if (!result.ok) {
      onError?.(result.error ?? "Failed to update stage.");
      return;
    }

    onStageChanged();
  }

  async function handleConvert(row: LeadRow) {
    setConvertingId(row.id);
    const result = await convertWonLeadToCrm(row.id);
    setConvertingId(null);

    if (!result.ok) {
      onError?.(result.error ?? "Failed to add lead to CRM.");
      return;
    }

    onStageChanged();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Lead</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">CRM</th>
              <th className="px-4 py-3 font-semibold">Follow-up</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const linkedToCrm = Boolean(row.organization_id);
              const canConvert = row.stage === "won" && !linkedToCrm;

              return (
                <tr
                  className="border-t border-border align-top transition hover:bg-secondary/40"
                  key={row.id}
                >
                  <td className="px-4 py-4">
                    <div className="font-semibold">{row.business_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {row.title}
                    </div>
                    {row.message ? (
                      <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                        {row.message}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{row.contact_name}</div>
                    <a
                      className="mt-1 block text-xs text-accent hover:underline"
                      href={`mailto:${row.email}`}
                    >
                      {row.email}
                    </a>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {row.phone || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {leadSourceLabel(row.source)}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      aria-label={`Update stage for ${row.business_name}`}
                      className={cn(
                        "min-h-10 w-full rounded-full border px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring/20",
                        stageStyles[row.stage],
                      )}
                      disabled={stageUpdatingId === row.id}
                      key={`${row.id}-${row.stage}`}
                      onChange={(event) =>
                        handleStageChange(
                          row.id,
                          event.target.value as LeadStage,
                        )
                      }
                      value={row.stage}
                    >
                      {LEAD_STAGES.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    {linkedToCrm ? (
                      <Link
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                        href={`/admin/organizations/${row.organization_id}`}
                      >
                        <Building2 aria-hidden className="size-3.5" />
                        In CRM
                      </Link>
                    ) : canConvert ? (
                      <Button
                        disabled={convertingId === row.id}
                        onClick={() => handleConvert(row)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <UserPlus aria-hidden className="size-3.5" />
                        {convertingId === row.id ? "Adding…" : "Add to CRM"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {row.next_follow_up_at || "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button
                        aria-label={`Edit ${row.business_name}`}
                        onClick={() => onEdit(row)}
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <Pencil aria-hidden className="size-4" />
                      </Button>
                      <Button
                        aria-label={`Delete ${row.business_name}`}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
