import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { InvoicePdfDocument } from "@/components/admin/invoice-pdf-document";
import { ProposalPrintButton } from "@/components/admin/proposal-print-button";
import { Button } from "@/components/ui/button";
import type { InvoiceWithItems } from "@/lib/invoices";
import { createClient } from "@/lib/supabase/server";

type InvoicePdfPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InvoicePdfPage({
  params,
}: InvoicePdfPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  const { data, error } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load invoice: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  const invoice = data as InvoiceWithItems;

  return (
    <main className="min-h-screen bg-[#F7FAFC] px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[8.5in] flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href={`/crm/invoices/${invoice.id}`}>
            <ArrowLeft aria-hidden className="size-4" />
            Back to editor
          </Link>
        </Button>
        <ProposalPrintButton />
      </div>

      <InvoicePdfDocument invoice={invoice} />

      <p className="mx-auto mt-4 max-w-[8.5in] text-center text-sm text-muted-foreground print:hidden">
        Use <strong>Print / Save as PDF</strong>, choose “Save as PDF” as the
        destination, then attach the file to your email.
      </p>
    </main>
  );
}
