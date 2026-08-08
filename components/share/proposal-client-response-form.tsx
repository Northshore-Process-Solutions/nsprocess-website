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
      <section className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-soft sm:mt-8 sm:p-6">
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
    <>
      <section className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-soft sm:mt-8 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your response</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Accept or decline this proposal. A short comment is optional.
        </p>

        <label className="mt-4 block space-y-2 text-sm font-semibold">
          Comment{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-28 sm:text-sm"
            onChange={(event) => setComment(event.target.value)}
            placeholder="Questions, timing notes, or why you're declining…"
            value={comment}
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
        ) : null}

        {/* Desktop actions */}
        <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
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

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button
            className="flex-1"
            disabled={loading !== null}
            onClick={() => submit("accepted")}
            type="button"
            variant="accent"
          >
            {loading === "accepted" ? "Submitting…" : "Accept"}
          </Button>
          <Button
            className="flex-1"
            disabled={loading !== null}
            onClick={() => submit("declined")}
            type="button"
            variant="outline"
          >
            {loading === "declined" ? "Submitting…" : "Decline"}
          </Button>
        </div>
      </div>
    </>
  );
}
