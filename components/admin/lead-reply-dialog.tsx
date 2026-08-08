"use client";

import { useState } from "react";
import { Sparkles, Undo2 } from "lucide-react";

import { optimizeLeadReply } from "@/app/crm/ai/actions";
import { replyToLead } from "@/app/crm/pipeline/actions";
import { Button } from "@/components/ui/button";
import {
  leadSourceLabel,
  leadStageLabel,
  type LeadRow,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

type LeadReplyDialogProps = {
  open: boolean;
  lead: LeadRow | null;
  projectId?: string | null;
  onClose: () => void;
  onSent: () => void;
};

function defaultSubject(lead: LeadRow) {
  return `Re: ${lead.title || "Free Process Review"} — ${lead.business_name}`;
}

function defaultBody(lead: LeadRow) {
  const firstName = lead.contact_name.trim().split(/\s+/)[0] || "there";
  return `Hi ${firstName},\n\n`;
}

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

export function LeadReplyDialog({
  open,
  lead,
  projectId = null,
  onClose,
  onSent,
}: LeadReplyDialogProps) {
  if (!open || !lead) return null;

  return (
    <LeadReplyDialogInner
      key={`${lead.id}-${projectId ?? "none"}`}
      lead={lead}
      onClose={onClose}
      onSent={onSent}
      projectId={projectId}
    />
  );
}

function LeadReplyDialogInner({
  lead,
  projectId,
  onClose,
  onSent,
}: {
  lead: LeadRow;
  projectId?: string | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState(() => defaultSubject(lead));
  const [body, setBody] = useState(() => defaultBody(lead));
  const [bodyBeforeAi, setBodyBeforeAi] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await replyToLead(lead.id, {
      subject,
      body,
      projectId,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to send email.");
      return;
    }

    onSent();
  }

  async function onOptimize() {
    setOptimizing(true);
    setError(null);

    const previous = body;
    const result = await optimizeLeadReply({
      businessName: lead.business_name,
      contactName: lead.contact_name,
      email: lead.email,
      title: lead.title,
      message: lead.message ?? undefined,
      notes: lead.notes ?? undefined,
      existingBody: body,
    });

    setOptimizing(false);

    if (!result.ok || !result.text) {
      setError(result.error ?? "Failed to optimize with AI.");
      return;
    }

    setBodyBeforeAi(previous);
    setBody(result.text);
  }

  function onUndoAi() {
    if (bodyBeforeAi === null) return;
    setBody(bodyBeforeAi);
    setBodyBeforeAi(null);
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-0 sm:items-center sm:p-6">
      <div
        aria-modal="true"
        className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-card sm:max-h-[92vh] sm:rounded-3xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Email lead
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="lg:hidden">Reply to {lead.contact_name}</span>
              <span className="hidden lg:inline">
                Review the inquiry on the left, write your reply on the right.
              </span>
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <aside className="border-b border-border bg-muted/30 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <button
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left lg:hidden"
              onClick={() => setDetailsOpen((open) => !open)}
              type="button"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Lead details
                </p>
                <p className="truncate text-sm font-semibold">
                  {lead.business_name}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                {detailsOpen ? "Hide" : "Show"}
              </span>
            </button>
            <div
              className={cn(
                "px-4 pb-4 lg:block lg:px-6 lg:py-5",
                detailsOpen ? "block" : "hidden",
              )}
            >
              <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:block">
                Lead details
              </p>
              <h3 className="mt-0 text-lg font-bold tracking-tight lg:mt-2 lg:text-xl">
                {lead.business_name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{lead.title}</p>

              <dl className="mt-4 space-y-4 lg:mt-6">
                <DetailItem label="Contact" value={lead.contact_name} />
                <DetailItem
                  label="Email"
                  value={
                    <a
                      className="break-all text-accent hover:underline"
                      href={`mailto:${lead.email}`}
                    >
                      {lead.email}
                    </a>
                  }
                />
                <DetailItem label="Phone" value={lead.phone || "—"} />
                <DetailItem
                  label="Source"
                  value={leadSourceLabel(lead.source)}
                />
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
                  label="Inquiry message"
                  value={
                    <p className="whitespace-pre-wrap font-normal leading-6 text-foreground/90">
                      {lead.message || "—"}
                    </p>
                  }
                />
                {lead.notes ? (
                  <DetailItem
                    label="Internal notes"
                    value={
                      <p className="whitespace-pre-wrap font-normal leading-6 text-foreground/90">
                        {lead.notes}
                      </p>
                    }
                  />
                ) : null}
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
              </dl>
            </div>
          </aside>

          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={onSubmit}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your email
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sending to {lead.contact_name}
              </p>

              <div className="mt-5 flex flex-col gap-4">
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
                    {error}
                  </div>
                ) : null}

                <label className="block space-y-2 text-sm font-semibold">
                  To
                  <input
                    className="min-h-11 w-full rounded-2xl border border-input bg-muted/40 px-4 py-3 text-base font-normal outline-none"
                    readOnly
                    value={lead.email}
                  />
                </label>

                <label className="block space-y-2 text-sm font-semibold">
                  Subject
                  <input
                    className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    onChange={(event) => setSubject(event.target.value)}
                    required
                    value={subject}
                  />
                </label>

                <div className="flex flex-col space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      className="text-sm font-semibold"
                      htmlFor="lead-reply-body"
                    >
                      Message
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {bodyBeforeAi !== null ? (
                        <Button
                          disabled={loading || optimizing}
                          onClick={onUndoAi}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Undo2 aria-hidden className="size-3.5" />
                          Undo AI
                        </Button>
                      ) : null}
                      <Button
                        disabled={loading || optimizing}
                        onClick={onOptimize}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Sparkles aria-hidden className="size-3.5" />
                        {optimizing ? "Optimizing…" : "Optimize with AI"}
                      </Button>
                    </div>
                  </div>
                  <textarea
                    className="min-h-48 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 sm:min-h-56 lg:min-h-72"
                    id="lead-reply-body"
                    onChange={(event) => setBody(event.target.value)}
                    required
                    value={body}
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-card px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
              <Button onClick={onClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button
                disabled={loading || optimizing}
                type="submit"
                variant="accent"
              >
                {loading ? "Sending..." : "Send email"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
