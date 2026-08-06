import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProposalPrintButton } from "@/components/admin/proposal-print-button";
import { StatementPdfDocument } from "@/components/admin/statement-pdf-document";
import { Button } from "@/components/ui/button";
import { isDateOnly } from "@/lib/billing";
import { loadDemoCrmData } from "@/lib/demo/data";
import { findDemoOrganization } from "@/lib/demo/map-to-crm";
import { documentIssuerFromDemoBusiness } from "@/lib/document-issuer";
import { invoiceBalance } from "@/lib/invoices";

type DemoStatementViewPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
    from?: string;
    to?: string;
  }>;
};

export const metadata = {
  title: "Demo Statement",
  robots: { index: false, follow: false },
};

export default async function DemoStatementViewPage({
  searchParams,
}: DemoStatementViewPageProps) {
  const params = await searchParams;
  const organizationId = params?.organizationId;
  const from = params?.from;
  const to = params?.to;

  if (!organizationId || !from || !to) {
    redirect("/demo/statements");
  }

  if (!isDateOnly(from) || !isDateOnly(to)) {
    redirect("/demo/statements");
  }

  const data = await loadDemoCrmData();
  const organization = findDemoOrganization(data, organizationId);

  if (!organization) {
    redirect("/demo/statements");
  }

  const orgInvoices = data.invoices.filter(
    (invoice) => invoice.organization_id === organizationId,
  );

  const periodInvoices = orgInvoices
    .filter(
      (invoice) =>
        invoice.issued_at >= from && invoice.issued_at <= to,
    )
    .sort((a, b) => a.issued_at.localeCompare(b.issued_at));

  const priorFiltered = orgInvoices.filter(
    (invoice) =>
      invoice.issued_at < from &&
      invoice.status !== "paid" &&
      invoice.status !== "void",
  );

  const priorOpenBalance = priorFiltered.reduce(
    (sum, invoice) => sum + invoiceBalance(invoice),
    0,
  );

  return (
    <main className="min-h-screen bg-[#F7FAFC] px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[8.5in] flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href="/demo/statements">
            <ArrowLeft aria-hidden className="size-4" />
            Back to statements
          </Link>
        </Button>
        <ProposalPrintButton />
      </div>

      <StatementPdfDocument
        from={from}
        invoices={periodInvoices}
        issuer={documentIssuerFromDemoBusiness(data.seed.business)}
        organizationName={organization.name}
        priorOpenBalance={Math.round(priorOpenBalance * 100) / 100}
        to={to}
      />

      <p className="mx-auto mt-4 max-w-[8.5in] text-center text-sm text-muted-foreground print:hidden">
        Use <strong>Print / Save as PDF</strong> to save or share this
        statement.
      </p>
    </main>
  );
}
