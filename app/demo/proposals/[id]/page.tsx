import { notFound } from "next/navigation";

import { SalesSubnav } from "@/components/admin/sales-subnav";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import { DemoPreviewBanner } from "@/components/demo/demo-preview-banner";
import { loadDemoCrmData } from "@/lib/demo/data";
import { findDemoProposal } from "@/lib/demo/map-to-crm";

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
  const initialProposal = findDemoProposal(data, id);
  if (!initialProposal) notFound();

  return (
    <main>
      <DemoPreviewBanner />
      <header className="mb-5">
        <SalesSubnav current="proposals" />
      </header>
      <ProposalEditor initialProposal={initialProposal} mode="edit" />
    </main>
  );
}
