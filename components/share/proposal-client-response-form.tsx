"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  respondToSharedProposal,
  type ClientResponseDecision,
} from "@/app/share/proposals/actions";
import { Button } from "@/components/ui/button";

type ProposalClientResponseFormProps = {
  token: string;
  alreadyResponded: boolean;
  decisionLabel?: string | null;
  existingComment?: string | null;
};

export function ProposalClientResponseForm({
  token,
  alreadyResponded,
  decisionLabel,
  existingComment,
}: ProposalClientResponseFormProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<ClientResponseDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: ClientResponseDecision) {
    setLoading(decision);
    setError(null);

    const result = await respondToSharedProposal({
      token,
      decision,
      comment,
    });

    setLoading(null);

    if (!result.ok) {
      setError(result.error ?? "Could not submit your response.");
      return;
    }

    router.refresh();
  }

  if (alreadyResponded) {
    return (
      <section className="mx-auto mt-8 max-w-[8.5in] rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-900">
          Response recorded
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You {decisionLabel ?? "already responded to"} this proposal. Thank
          you — we&apos;ll be in touch if needed.
        </p>
        {existingComment ? (
          <blockquote className="mt-4 rounded-xl border border-border bg-background p-4 text-sm whitespace-pre-wrap text-slate-800">
            {existingComment}
          </blockquote>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-[8.5in] rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900">Your response</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Accept or decline this proposal and leave a short comment for us.
      </p>

      <label className="mt-4 block space-y-2 text-sm font-semibold">
        Comment
        <textarea
          className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setComment(event.target.value)}
          placeholder="Questions, timing notes, or why you're declining…"
          required
          value={comment}
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={loading !== null}
          onClick={() => submit("accepted")}
          type="button"
          variant="accent"
        >
          {loading === "accepted" ? "Submitting…" : "Accept proposal"}
        </Button>
        <Button
          disabled={loading !== null}
          onClick={() => submit("declined")}
          type="button"
          variant="outline"
        >
          {loading === "declined" ? "Submitting…" : "Decline"}
        </Button>
      </div>
    </section>
  );
}
