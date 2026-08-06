import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AgreementPdfDocument } from "@/components/admin/agreement-pdf-document";
import { ProposalPrintButton } from "@/components/admin/proposal-print-button";
import { Button } from "@/components/ui/button";
import { loadDemoCrmData } from "@/lib/demo/data";
import { findDemoAgreement } from "@/lib/demo/map-to-crm";

type DemoAgreementPdfPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Demo Agreement PDF",
  robots: { index: false, follow: false },
};

export default async function DemoAgreementPdfPage({
  params,
}: DemoAgreementPdfPageProps) {
  const { id } = await params;
  const data = await loadDemoCrmData();
  const agreement = findDemoAgreement(data, id);

  if (!agreement) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F7FAFC] px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[8.5in] flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href={`/demo/agreements/${agreement.id}`}>
            <ArrowLeft aria-hidden className="size-4" />
            Back to editor
          </Link>
        </Button>
        <ProposalPrintButton />
      </div>

      <AgreementPdfDocument agreement={agreement} />

      <p className="mx-auto mt-4 max-w-[8.5in] text-center text-sm text-muted-foreground print:hidden">
        Use <strong>Print / Save as PDF</strong>, choose “Save as PDF” as the
        destination, then attach the file to your email.
      </p>
    </main>
  );
}
