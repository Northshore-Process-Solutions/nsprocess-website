"use client";

import Link from "next/link";
import { CalendarDays, FileText, Flag, Mail, Pencil, Trash2 } from "lucide-react";

import { ActivityPanel } from "@/components/admin/activity-panel";
import { SpamFlagBadge } from "@/components/admin/spam-flag-badge";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import {
  leadSourceLabel,
  leadStageLabel,
  type LeadInsight,
  type LeadRow,
} from "@/lib/leads";
import { parseLeadInsight } from "@/lib/ai/generate-lead-insight";

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
  onRescanSpam?: (lead: LeadRow) => void;
  onClearSpam?: (lead: LeadRow) => void;
  rescanningSpam?: boolean;
  clearingSpam?: boolean;
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

function LeadInsightCard({
  insight,
  generatedAt,
}: {
  insight: LeadInsight;
  generatedAt: string | null;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">Lead insight</p>
        {generatedAt ? (
          <p className="text-xs text-emerald-900/70">
            {new Date(generatedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      {insight.companySnapshot ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900/70">
            Company
          </p>
          <p className="mt-1 whitespace-pre-wrap text-emerald-950/95">
            {insight.companySnapshot}
          </p>
        </div>
      ) : null}

      {insight.fit ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900/70">
            Fit
          </p>
          <p className="mt-1 whitespace-pre-wrap text-emerald-950/95">
            {insight.fit}
          </p>
        </div>
      ) : null}

      {insight.talkingPoints.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900/70">
            Talking points
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-emerald-950/95">
            {insight.talkingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {insight.nextStep ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900/70">
            Next step
          </p>
          <p className="mt-1 font-medium text-emerald-950">{insight.nextStep}</p>
        </div>
      ) : null}

      {insight.risks ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900/70">
            Watch-outs
          </p>
          <p className="mt-1 text-emerald-950/90">{insight.risks}</p>
        </div>
      ) : null}
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
  onRescanSpam,
  onClearSpam,
  rescanningSpam = false,
  clearingSpam = false,
}: LeadDetailDialogProps) {
  const { href, isDemo } = usePortal();
  if (!open || !lead) return null;

  const existingProposalId = proposalId ?? acceptedProposalId;
  const insight = parseLeadInsight(lead.lead_insight);

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
          {insight ? (
            <LeadInsightCard
              generatedAt={lead.insight_generated_at}
              insight={insight}
            />
          ) : null}

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
              {onClearSpam ? (
                <div className="mt-3">
                  <Button
                    disabled={clearingSpam}
                    onClick={() => onClearSpam(lead)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {clearingSpam ? "Clearing…" : "Clear flag"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {onRescanSpam ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">AI insight & spam check</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lead.insight_generated_at || lead.spam_scanned_at
                    ? `Last run ${new Date(
                        lead.insight_generated_at || lead.spam_scanned_at!,
                      ).toLocaleString()}`
                    : "Not run yet"}
                  {!lead.spam_flag && lead.spam_scanned_at
                    ? " · No spam flag"
                    : null}
                </p>
              </div>
              <Button
                disabled={rescanningSpam}
                onClick={() => onRescanSpam(lead)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Flag aria-hidden className="size-3.5" />
                {rescanningSpam ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          ) : null}

          {lead.research_summary?.trim() ? (
            <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-950">
              <p className="font-semibold">Background research</p>
              {lead.researched_at ? (
                <p className="mt-0.5 text-xs text-sky-900/70">
                  Researched {new Date(lead.researched_at).toLocaleString()}
                </p>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sky-950/95">
                {lead.research_summary.trim()}
              </p>
              {lead.research_sources && lead.research_sources.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs">
                  {lead.research_sources.map((source) => (
                    <li key={source.url}>
                      <a
                        className="break-all text-sky-800 underline-offset-2 hover:underline"
                        href={source.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {source.title?.trim() || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
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
