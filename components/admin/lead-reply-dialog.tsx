"use client";

import { useState } from "react";

import { replyToLead } from "@/app/admin/pipeline/actions";
import { Button } from "@/components/ui/button";
import type { LeadRow } from "@/lib/leads";

type LeadReplyDialogProps = {
  open: boolean;
  lead: LeadRow | null;
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

export function LeadReplyDialog({
  open,
  lead,
  onClose,
  onSent,
}: LeadReplyDialogProps) {
  if (!open || !lead) return null;

  return (
    <LeadReplyDialogInner
      key={lead.id}
      lead={lead}
      onClose={onClose}
      onSent={onSent}
    />
  );
}

function LeadReplyDialogInner({
  lead,
  onClose,
  onSent,
}: {
  lead: LeadRow;
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

    const result = await replyToLead(lead.id, { subject, body });
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to send email.");
      return;
    }

    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-4 sm:items-center">
      <div
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Email lead</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send a message to {lead.contact_name} at {lead.email}.
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="ghost">
            Close
          </Button>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
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

          <label className="block space-y-2 text-sm font-semibold">
            Message
            <textarea
              className="min-h-48 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => setBody(event.target.value)}
              required
              value={body}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
  );
}
