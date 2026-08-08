import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalClientResponseForm } from "@/components/share/proposal-client-response-form";
import { ProposalShareView } from "@/components/share/proposal-share-view";
import { getAppBrand, getLiveDocumentIssuer } from "@/lib/app-brand";
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
  const brand = await getAppBrand();
  const issuer = await getLiveDocumentIssuer();

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-3 py-5 pb-28 sm:px-6 sm:py-10 sm:pb-10">
      <div className="mx-auto mb-4 max-w-3xl text-left sm:mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {brand.companyName}
        </p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Proposal {proposal.proposal_number}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the details below, then accept or decline.
        </p>
      </div>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
        <ProposalShareView issuer={issuer} proposal={proposal} />
      </div>

      {proposal.status === "expired" && !alreadyResponded ? (
        <section className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 sm:mt-8 sm:p-6">
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
