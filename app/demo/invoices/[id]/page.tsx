import { notFound } from "next/navigation";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { DemoPreviewBanner } from "@/components/demo/demo-preview-banner";
import { loadDemoCrmData } from "@/lib/demo/data";
import type { InvoiceWithItems } from "@/lib/invoices";

export const metadata = {
  title: "Demo Invoice",
  robots: { index: false, follow: false },
};

export default async function DemoInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadDemoCrmData();
  const invoice = data.invoices.find((row) => row.id === id);
  if (!invoice) notFound();

  const initialInvoice = {
    ...invoice,
    invoice_items: [],
  } satisfies InvoiceWithItems;

  return (
    <main className="max-w-5xl">
      <DemoPreviewBanner />
      <header className="mb-5">
        <BillingSubnav current="invoices" />
      </header>
      <InvoiceEditor initialInvoice={initialInvoice} mode="edit" />
    </main>
  );
}
