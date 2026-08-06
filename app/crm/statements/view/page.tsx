import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProposalPrintButton } from "@/components/admin/proposal-print-button";
import { StatementPdfDocument } from "@/components/admin/statement-pdf-document";
import { Button } from "@/components/ui/button";
import { invoiceBalance, type InvoiceWithItems } from "@/lib/invoices";
import { isDateOnly } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

type StatementViewPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function StatementViewPage({
  searchParams,
}: StatementViewPageProps) {
  const params = await searchParams;
  const organizationId = params?.organizationId;
  const from = params?.from;
  const to = params?.to;

  if (!organizationId || !from || !to) {
    redirect("/crm/statements");
  }

  if (!isDateOnly(from) || !isDateOnly(to)) {
    redirect("/crm/statements");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgError) {
    throw new Error(`Failed to load organization: ${orgError.message}`);
  }

  if (!organization) {
    redirect("/crm/statements");
  }

  const [
    { data: periodInvoices, error: periodError },
    { data: priorInvoices, error: priorError },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_items (
          id,
          invoice_id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order,
          created_at
        )
      `,
      )
      .eq("organization_id", organizationId)
      .gte("issued_at", from)
      .lte("issued_at", to)
      .order("issued_at", { ascending: true }),
    supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_items (
          id,
          invoice_id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order,
          created_at
        )
      `,
      )
      .eq("organization_id", organizationId)
      .lt("issued_at", from),
  ]);

  if (periodError) {
    throw new Error(`Failed to load invoices: ${periodError.message}`);
  }
  if (priorError) {
    throw new Error(
      `Failed to load prior invoices: ${priorError.message}`,
    );
  }

  const priorFiltered = (priorInvoices ?? []).filter(
    (invoice) => invoice.status !== "paid" && invoice.status !== "void",
  );

  const priorOpenBalance = priorFiltered.reduce(
    (sum, invoice) =>
      sum + invoiceBalance(invoice as InvoiceWithItems),
    0,
  );

  return (
    <main className="min-h-screen bg-[#F7FAFC] px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[8.5in] flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href="/crm/statements">
            <ArrowLeft aria-hidden className="size-4" />
            Back to statements
          </Link>
        </Button>
        <ProposalPrintButton />
      </div>

      <StatementPdfDocument
        from={from}
        invoices={(periodInvoices ?? []) as InvoiceWithItems[]}
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
