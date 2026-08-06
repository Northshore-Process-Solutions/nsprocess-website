import { notFound } from "next/navigation";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import { DemoPreviewBanner } from "@/components/demo/demo-preview-banner";
import { loadDemoCrmData } from "@/lib/demo/data";
import type { ProposalWithItems } from "@/lib/proposals";

export const metadata = {
  title: "Demo Proposal",
  robots: { index: false, follow: false },
};

export default async function DemoProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadDemoCrmData();
  const proposal = data.proposals.find((row) => row.id === id);
  if (!proposal) notFound();

  const initialProposal = {
    ...proposal,
    proposal_items: [],
  } satisfies ProposalWithItems;

  return (
    <main className="max-w-5xl">
      <DemoPreviewBanner />
      <header className="mb-5">
        <BillingSubnav current="proposals" />
      </header>
      <ProposalEditor initialProposal={initialProposal} mode="edit" />
    </main>
  );
}
