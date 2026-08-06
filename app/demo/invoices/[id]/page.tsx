import { notFound } from "next/navigation";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { DemoPreviewBanner } from "@/components/demo/demo-preview-banner";
import { loadDemoCrmData } from "@/lib/demo/data";
import { findDemoInvoice } from "@/lib/demo/map-to-crm";

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
  const initialInvoice = findDemoInvoice(data, id);
  if (!initialInvoice) notFound();

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
