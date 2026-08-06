"use client";

import Link from "next/link";
import { CalendarDays, FileText, Mail, Pencil, Trash2 } from "lucide-react";

import { ActivityPanel } from "@/components/admin/activity-panel";
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
  onClose,
  onEdit,
  onReply,
  onDelete,
}: LeadDetailDialogProps) {
  const { href, isDemo } = usePortal();
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
              Lead
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
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

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Contact" value={lead.contact_name} />
            <DetailItem label="Email" value={lead.email} />
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

        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {onDelete ? (
            <Button
              disabled={deleting}
              onClick={() => onDelete(lead)}
              type="button"
              variant="outline"
            >
              <Trash2 aria-hidden className="size-4" />
              {deleting ? "Deleting…" : "Delete lead"}
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex flex-wrap gap-2 sm:justify-end">
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
            {!isDemo ? (
              <Button asChild type="button" variant="outline">
                <Link href={href(`/proposals/new?leadId=${lead.id}`)}>
                  <FileText aria-hidden className="size-4" />
                  Proposal
                </Link>
              </Button>
            ) : null}
            {onEdit ? (
              <Button
                onClick={() => onEdit(lead)}
                type="button"
                variant="accent"
              >
                <Pencil aria-hidden className="size-4" />
                Edit lead
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
