"use client";

import Link from "next/link";
import { CalendarDays, FileText, Mail, Pencil, Trash2 } from "lucide-react";

import { ActivityPanel } from "@/components/admin/activity-panel";
import { SpamFlagBadge } from "@/components/admin/spam-flag-badge";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import {
  leadSourceLabel,
  leadStageLabel,
  type LeadRow,
} from "@/lib/leads";

type LeadDetailDialogProps = {
  open: boolean;
  lead: LeadRow | null;
  activities?: ActivityRow[];
  deleting?: boolean;
  acceptedProposalId?: string | null;
  /** Existing proposal for this lead (opens instead of creating a new one). */
  proposalId?: string | null;
  onClose: () => void;
  onEdit?: (lead: LeadRow) => void;
  onReply?: (lead: LeadRow) => void;
  onDelete?: (lead: LeadRow) => void;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function LeadDetailDialog({
  open,
  lead,
  activities = [],
  deleting = false,
  acceptedProposalId = null,
  proposalId = null,
  onClose,
  onEdit,
  onReply,
  onDelete,
}: LeadDetailDialogProps) {
  const { href, isDemo } = usePortal();
  if (!open || !lead) return null;

  const existingProposalId = proposalId ?? acceptedProposalId;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/40 p-0 sm:items-center sm:p-6">
      <div
        aria-modal="true"
        className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-card sm:max-h-[92vh] sm:rounded-3xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Lead
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight">
              {lead.business_name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {leadStageLabel(lead.stage)} · {leadSourceLabel(lead.source)}
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="outline">
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {lead.spam_flag ? (
            <div
              className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"
              role="status"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SpamFlagBadge reason={lead.spam_reason} />
                <p className="font-semibold">Possible spam or advertising</p>
              </div>
              {lead.spam_reason ? (
                <p className="mt-2 text-orange-900/90">{lead.spam_reason}</p>
              ) : null}
            </div>
          ) : null}

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Contact" value={lead.contact_name} />
            <DetailItem
              label="Email"
              value={
                <span className="break-all">{lead.email}</span>
              }
            />
            <DetailItem label="Phone" value={lead.phone || "—"} />
            <DetailItem
              label="Follow-up"
              value={lead.next_follow_up_at || "Not set"}
            />
            <DetailItem label="Message" value={lead.message || "—"} />
            {lead.organization_id ? (
              <DetailItem
                label="Business"
                value={
                  <Link
                    className="text-accent hover:underline"
                    href={href(`/organizations/${lead.organization_id}`)}
                  >
                    Open account hub
                  </Link>
                }
              />
            ) : null}
          </dl>

          {lead.stage === "proposal_accepted" ? (
            <div className="mt-6 rounded-2xl border border-lime-200 bg-lime-50 p-4 text-sm text-lime-950">
              <p className="font-semibold">Next: close the deal</p>
              <p className="mt-1 text-lime-900/80">
                Create the agreement and deposit invoice from the accepted
                proposal. This lead leaves Pipeline when deposit is marked paid.
              </p>
              {!isDemo ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {acceptedProposalId ? (
                    <Button asChild type="button" variant="accent">
                      <Link href={href(`/proposals/${acceptedProposalId}`)}>
                        Open accepted proposal
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild type="button" variant="accent">
                      <Link href={href("/sales")}>Go to Sales</Link>
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8">
            <ActivityPanel
              activities={activities}
              compact
              leadId={lead.id}
              organizationId={lead.organization_id}
              readOnly={isDemo}
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-card px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {onEdit ? (
              <Button
                className="w-full sm:w-auto"
                onClick={() => onEdit(lead)}
                type="button"
                variant="accent"
              >
                <Pencil aria-hidden className="size-4" />
                Edit lead
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {onReply ? (
                <Button
                  onClick={() => onReply(lead)}
                  type="button"
                  variant="outline"
                >
                  <Mail aria-hidden className="size-4" />
                  Reply
                </Button>
              ) : null}
              <Button asChild type="button" variant="outline">
                <Link href={href(`/calendar?leadId=${lead.id}`)}>
                  <CalendarDays aria-hidden className="size-4" />
                  Schedule
                </Link>
              </Button>
              {existingProposalId ? (
                <Button asChild type="button" variant="outline">
                  <Link href={href(`/proposals/${existingProposalId}`)}>
                    <FileText aria-hidden className="size-4" />
                    Proposal
                  </Link>
                </Button>
              ) : !isDemo ? (
                <Button asChild type="button" variant="outline">
                  <Link href={href(`/proposals/new?leadId=${lead.id}`)}>
                    <FileText aria-hidden className="size-4" />
                    Proposal
                  </Link>
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  disabled={deleting}
                  onClick={() => onDelete(lead)}
                  type="button"
                  variant="outline"
                >
                  <Trash2 aria-hidden className="size-4" />
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
