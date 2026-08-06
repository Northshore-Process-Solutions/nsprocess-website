import { notFound, redirect } from "next/navigation";

import { InvoiceEditor } from "@/components/admin/invoice-editor";
import type { InvoiceWithItems } from "@/lib/invoices";
import { createClient } from "@/lib/supabase/server";

type InvoicePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
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
      ),
      organizations (
        id,
        name
      ),
      agreements (
        id,
        agreement_number,
        title
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

  return (
    <main className="max-w-5xl">

      <InvoiceEditor initialInvoice={data as InvoiceWithItems} mode="edit" />
    </main>
  );
}
