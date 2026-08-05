"use client";

import { useState } from "react";

import { replyToLead } from "@/app/admin/pipeline/actions";
import { Button } from "@/components/ui/button";
import {
  leadSourceLabel,
  leadStageLabel,
  type LeadRow,
} from "@/lib/leads";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-3 sm:items-center sm:p-6">
      <div
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Email lead</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the inquiry on the left, write your reply on the right.
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <aside className="overflow-y-auto border-b border-border bg-muted/30 px-5 py-5 lg:border-b-0 lg:border-r lg:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Lead details
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight">
              {lead.business_name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{lead.title}</p>

            <dl className="mt-6 space-y-4">
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
          </aside>

          <form
            className="flex min-h-0 flex-col overflow-y-auto px-5 py-5 sm:px-6"
            onSubmit={onSubmit}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your email
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sending to {lead.contact_name}
            </p>

            <div className="mt-5 flex flex-1 flex-col gap-4">
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

              <label className="flex min-h-0 flex-1 flex-col space-y-2 text-sm font-semibold">
                Message
                <textarea
                  className="min-h-56 w-full flex-1 rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 lg:min-h-72"
                  onChange={(event) => setBody(event.target.value)}
                  required
                  value={body}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button onClick={onClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={loading} type="submit" variant="accent">
                {loading ? "Sending..." : "Send email"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
