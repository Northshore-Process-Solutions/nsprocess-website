import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalPdfDocument } from "@/components/admin/proposal-pdf-document";
import { ProposalClientResponseForm } from "@/components/share/proposal-client-response-form";
import { proposalStatusLabel, type ProposalWithItems } from "@/lib/proposals";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type PublicProposalPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Proposal",
    robots: { index: false, follow: false },
    description: "Review and respond to your proposal.",
  };
}

export default async function PublicProposalPage({
  params,
}: PublicProposalPageProps) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    throw new Error("Proposal sharing is not configured on this server.");
  }

  const { data, error } = await admin
    .from("proposals")
    .select(
      `
      *,
      proposal_items (
        id,
        proposal_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      )
    `,
    )
    .eq("share_token", token.trim())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load proposal: ${error.message}`);
  }

  if (!data) notFound();

  const proposal = data as ProposalWithItems;
  const visibleStatuses = new Set(["sent", "accepted", "declined", "expired"]);
  if (!visibleStatuses.has(proposal.status)) {
    notFound();
  }

  const alreadyResponded = Boolean(proposal.client_responded_at);
  const decisionLabel =
    proposal.status === "accepted"
      ? "accepted"
      : proposal.status === "declined"
        ? "declined"
        : proposalStatusLabel(proposal.status).toLowerCase();

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto mb-6 max-w-[8.5in] text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          North Shore Process Solutions
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Proposal {proposal.proposal_number}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the details below, then accept or decline with a comment.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
        <ProposalPdfDocument proposal={proposal} />
      </div>

      {proposal.status === "expired" && !alreadyResponded ? (
        <section className="mx-auto mt-8 max-w-[8.5in] rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          This proposal has expired. Please contact us if you&apos;d like an
          updated quote.
        </section>
      ) : (
        <ProposalClientResponseForm
          alreadyResponded={alreadyResponded}
          decisionLabel={decisionLabel}
          existingComment={proposal.client_response}
          token={token.trim()}
        />
      )}
    </main>
  );
}
