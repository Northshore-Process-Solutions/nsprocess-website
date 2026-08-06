"use client";

import Link from "next/link";
import { CalendarDays, FileText, Pencil, Trash2 } from "lucide-react";

import { ActivityPanel } from "@/components/admin/activity-panel";
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
  onClose: () => void;
  onEdit: (lead: LeadRow) => void;
  onDelete: (lead: LeadRow) => void;
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
  onClose,
  onEdit,
  onDelete,
}: LeadDetailDialogProps) {
  if (!open || !lead) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/40 p-3 sm:items-center sm:p-6">
      <div
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Lead details
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {lead.business_name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{lead.title}</p>
          </div>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Contact" value={lead.contact_name} />
            <DetailItem
              label="Email"
              value={
                <a
                  className="text-accent hover:underline"
                  href={`mailto:${lead.email}`}
                >
                  {lead.email}
                </a>
              }
            />
            <DetailItem label="Phone" value={lead.phone || "—"} />
            <DetailItem label="Source" value={leadSourceLabel(lead.source)} />
            <DetailItem label="Stage" value={leadStageLabel(lead.stage)} />
            <DetailItem
              label="Follow-up"
              value={lead.next_follow_up_at || "—"}
            />
            <DetailItem
              label="Created"
              value={new Date(lead.created_at).toLocaleString()}
            />
            <DetailItem
              label="Updated"
              value={new Date(lead.updated_at).toLocaleString()}
            />
            <DetailItem
              label="Business"
              value={
                lead.organization_id ? (
                  <Link
                    className="text-accent hover:underline"
                    href={`/admin/organizations/${lead.organization_id}`}
                  >
                    View business
                  </Link>
                ) : (
                  "Not linked"
                )
              }
            />
          </dl>

          <div className="mt-6 space-y-4">
            <DetailItem
              label="Inquiry message"
              value={
                <p className="whitespace-pre-wrap font-normal leading-6 text-foreground/90">
                  {lead.message || "—"}
                </p>
              }
            />
            <DetailItem
              label="Internal notes"
              value={
                <p className="whitespace-pre-wrap font-normal leading-6 text-foreground/90">
                  {lead.notes || "—"}
                </p>
              }
            />
            {lead.lost_reason ? (
              <DetailItem
                label="Lost reason"
                value={
                  <p className="whitespace-pre-wrap font-normal leading-6 text-foreground/90">
                    {lead.lost_reason}
                  </p>
                }
              />
            ) : null}
          </div>

          <div className="mt-8">
            <ActivityPanel
              activities={activities}
              compact
              leadId={lead.id}
              organizationId={lead.organization_id}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button
            disabled={deleting}
            onClick={() => onDelete(lead)}
            type="button"
            variant="outline"
          >
            <Trash2 aria-hidden className="size-4" />
            {deleting ? "Deleting…" : "Delete lead"}
          </Button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button asChild type="button" variant="outline">
              <Link href={`/admin/calendar?leadId=${lead.id}`}>
                <CalendarDays aria-hidden className="size-4" />
                Schedule
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href={`/admin/proposals/new?leadId=${lead.id}`}>
                <FileText aria-hidden className="size-4" />
                Proposal
              </Link>
            </Button>
            <Button onClick={onClose} type="button" variant="outline">
              Close
            </Button>
            <Button onClick={() => onEdit(lead)} type="button" variant="accent">
              <Pencil aria-hidden className="size-4" />
              Edit lead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
