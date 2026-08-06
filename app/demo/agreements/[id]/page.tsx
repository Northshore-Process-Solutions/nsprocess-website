import { notFound } from "next/navigation";

import { AgreementEditor } from "@/components/admin/agreement-editor";
import { BillingSubnav } from "@/components/admin/billing-subnav";
import { DemoPreviewBanner } from "@/components/demo/demo-preview-banner";
import { loadDemoCrmData } from "@/lib/demo/data";
import type { AgreementWithItems } from "@/lib/agreements";

export const metadata = {
  title: "Demo Agreement",
  robots: { index: false, follow: false },
};

export default async function DemoAgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadDemoCrmData();
  const agreement = data.agreements.find((row) => row.id === id);
  if (!agreement) notFound();

  const initialAgreement = {
    ...agreement,
    agreement_items: [],
  } satisfies AgreementWithItems;

  return (
    <main className="max-w-5xl">
      <DemoPreviewBanner />
      <header className="mb-5">
        <BillingSubnav current="agreements" />
      </header>
      <AgreementEditor initialAgreement={initialAgreement} mode="edit" />
    </main>
  );
}
