import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProposalPdfDocument } from "@/components/admin/proposal-pdf-document";
import { ProposalPrintButton } from "@/components/admin/proposal-print-button";
import { Button } from "@/components/ui/button";
import { loadDemoCrmData } from "@/lib/demo/data";
import { findDemoProposal } from "@/lib/demo/map-to-crm";

type DemoProposalPdfPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Demo Proposal PDF",
  robots: { index: false, follow: false },
};

export default async function DemoProposalPdfPage({
  params,
}: DemoProposalPdfPageProps) {
  const { id } = await params;
  const data = await loadDemoCrmData();
  const proposal = findDemoProposal(data, id);

  if (!proposal) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F7FAFC] px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[8.5in] flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href={`/demo/proposals/${proposal.id}`}>
            <ArrowLeft aria-hidden className="size-4" />
            Back to editor
          </Link>
        </Button>
        <ProposalPrintButton />
      </div>

      <ProposalPdfDocument proposal={proposal} />

      <p className="mx-auto mt-4 max-w-[8.5in] text-center text-sm text-muted-foreground print:hidden">
        Use <strong>Print / Save as PDF</strong>, choose “Save as PDF” as the
        destination, then attach the file to your email.
      </p>
    </main>
  );
}
