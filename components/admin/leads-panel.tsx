"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clearLeadSpamFlag,
  deleteLead,
  linkLeadToOrganization,
  rescanLeadSpam,
  unlinkLeadFromOrganization,
} from "@/app/crm/pipeline/actions";
import {
  LeadDetailDialog,
  type LeadOrganizationOption,
} from "@/components/admin/lead-detail-dialog";
import { LeadForm } from "@/components/admin/lead-form";
import { LeadReplyDialog } from "@/components/admin/lead-reply-dialog";
import { LeadsTable } from "@/components/admin/leads-table";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import type { CalendarEventRow } from "@/lib/calendar";
import type { LeadRow } from "@/lib/leads";

export function LeadsPanel({
  rows,
  activitiesByLeadId = {},
  eventsByLeadId = {},
  acceptedProposalByLeadId = {},
  proposalByLeadId = {},
  organizations = [],
  readOnly = false,
  initialLeadId = null,
}: {
  rows: LeadRow[];
  activitiesByLeadId?: Record<string, ActivityRow[]>;
  eventsByLeadId?: Record<string, CalendarEventRow[]>;
  acceptedProposalByLeadId?: Record<string, string>;
  /** Latest proposal id for each lead (any status). */
  proposalByLeadId?: Record<string, string>;
  organizations?: LeadOrganizationOption[];
  readOnly?: boolean;
  /** Open this lead’s detail sheet on load (e.g. home deep link). */
  initialLeadId?: string | null;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<LeadRow | null>(null);
  const [replyLead, setReplyLead] = useState<LeadRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rescanningSpamId, setRescanningSpamId] = useState<string | null>(null);
  const [clearingSpamId, setClearingSpamId] = useState<string | null>(null);
  const [linkingOrgId, setLinkingOrgId] = useState<string | null>(null);
  const [unlinkingOrgId, setUnlinkingOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openedInitialId, setOpenedInitialId] = useState<string | null>(null);

  function openCreate() {
    setMode("create");
    setSelectedRow(null);
    setError(null);
    setDetailOpen(false);
    setFormOpen(true);
  }

  function openView(row: LeadRow) {
    setSelectedRow(row);
    setError(null);
    setFormOpen(false);
    setDetailOpen(true);
  }

  function openEdit(row: LeadRow) {
    setMode("edit");
    setSelectedRow(row);
    setError(null);
    setDetailOpen(false);
    setFormOpen(true);
  }

  function openReply(row: LeadRow) {
    setReplyLead(row);
    setError(null);
    setFormOpen(false);
    setDetailOpen(false);
    setReplyOpen(true);
  }

  useEffect(() => {
    if (!initialLeadId || openedInitialId === initialLeadId) return;
    const lead = rows.find((row) => row.id === initialLeadId);
    if (!lead) return;
    setOpenedInitialId(initialLeadId);
    openView(lead);
  }, [initialLeadId, openedInitialId, rows]);

  // Keep the open detail sheet in sync after router.refresh().
  useEffect(() => {
    if (!selectedRow?.id) return;
    const fresh = rows.find((row) => row.id === selectedRow.id);
    if (fresh) setSelectedRow(fresh);
    // Only re-sync when the rows payload changes or the open lead id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [rows, selectedRow?.id]);

  async function handleDelete(row: LeadRow) {
    const confirmed = window.confirm(
      `Delete lead for ${row.business_name}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);

    const result = await deleteLead(row.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete lead.");
      return;
    }

    setDetailOpen(false);
    setSelectedRow(null);
    router.refresh();
  }

  async function handleRescanSpam(row: LeadRow) {
    setRescanningSpamId(row.id);
    setError(null);

    const result = await rescanLeadSpam(row.id);
    setRescanningSpamId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to refresh lead insight.");
      return;
    }

    router.refresh();
  }

  async function handleClearSpam(row: LeadRow) {
    setClearingSpamId(row.id);
    setError(null);

    const result = await clearLeadSpamFlag(row.id);
    setClearingSpamId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to clear spam flag.");
      return;
    }

    setSelectedRow((current) =>
      current?.id === row.id
        ? { ...current, spam_flag: false, spam_reason: null }
        : current,
    );
    router.refresh();
  }

  async function handleLinkOrganization(row: LeadRow, organizationId: string) {
    setLinkingOrgId(row.id);
    setError(null);

    const result = await linkLeadToOrganization(row.id, organizationId);
    setLinkingOrgId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to link business.");
      return;
    }

    setSelectedRow((current) =>
      current?.id === row.id
        ? {
            ...current,
            organization_id: organizationId,
            contact_id: current.contact_id,
          }
        : current,
    );
    router.refresh();
  }

  async function handleUnlinkOrganization(row: LeadRow) {
    setUnlinkingOrgId(row.id);
    setError(null);

    const result = await unlinkLeadFromOrganization(row.id);
    setUnlinkingOrgId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to unlink business.");
      return;
    }

    setSelectedRow((current) =>
      current?.id === row.id
        ? { ...current, organization_id: null, contact_id: null }
        : current,
    );
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!readOnly ? (
        <div className="flex justify-end">
          <Button onClick={openCreate} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            Add lead
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <LeadsTable
        activitiesByLeadId={activitiesByLeadId}
        eventsByLeadId={eventsByLeadId}
        onReply={readOnly ? undefined : openReply}
        onView={openView}
        rows={rows}
      />

      <LeadDetailDialog
        acceptedProposalId={
          selectedRow
            ? (acceptedProposalByLeadId[selectedRow.id] ?? null)
            : null
        }
        activities={
          selectedRow ? (activitiesByLeadId[selectedRow.id] ?? []) : []
        }
        clearingSpam={Boolean(
          selectedRow && clearingSpamId === selectedRow.id,
        )}
        deleting={Boolean(selectedRow && deletingId === selectedRow.id)}
        lead={selectedRow}
        linkingOrganization={Boolean(
          selectedRow && linkingOrgId === selectedRow.id,
        )}
        onClearSpam={readOnly ? undefined : handleClearSpam}
        onClose={() => {
          setDetailOpen(false);
        }}
        onDelete={readOnly ? undefined : handleDelete}
        onEdit={readOnly ? undefined : openEdit}
        onLinkOrganization={readOnly ? undefined : handleLinkOrganization}
        onReply={readOnly ? undefined : openReply}
        onRescanSpam={readOnly ? undefined : handleRescanSpam}
        onUnlinkOrganization={readOnly ? undefined : handleUnlinkOrganization}
        open={detailOpen}
        organizations={organizations}
        proposalId={
          selectedRow ? (proposalByLeadId[selectedRow.id] ?? null) : null
        }
        rescanningSpam={Boolean(
          selectedRow && rescanningSpamId === selectedRow.id,
        )}
        unlinkingOrganization={Boolean(
          selectedRow && unlinkingOrgId === selectedRow.id,
        )}
      />

      {!readOnly ? (
        <>
          <LeadForm
            activities={
              selectedRow ? (activitiesByLeadId[selectedRow.id] ?? []) : []
            }
            initialRow={selectedRow}
            key={`${mode}-${selectedRow?.id ?? "new"}-${formOpen ? "open" : "closed"}`}
            mode={mode}
            onClose={() => {
              setFormOpen(false);
              if (mode === "edit" && selectedRow) {
                setDetailOpen(true);
              }
            }}
            onReply={openReply}
            onSaved={() => {
              setFormOpen(false);
              setDetailOpen(false);
              router.refresh();
            }}
            open={formOpen}
          />

          <LeadReplyDialog
            lead={replyLead}
            onClose={() => {
              setReplyOpen(false);
              setReplyLead(null);
            }}
            onSent={() => {
              setReplyOpen(false);
              setReplyLead(null);
              router.refresh();
            }}
            open={replyOpen}
          />
        </>
      ) : null}
    </div>
  );
}
