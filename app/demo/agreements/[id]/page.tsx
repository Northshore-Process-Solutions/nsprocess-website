import { notFound } from "next/navigation";

import { AgreementEditor } from "@/components/admin/agreement-editor";
import { SalesSubnav } from "@/components/admin/sales-subnav";
import { DemoPreviewBanner } from "@/components/demo/demo-preview-banner";
import { loadDemoCrmData } from "@/lib/demo/data";
import { findDemoAgreement } from "@/lib/demo/map-to-crm";

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
  const initialAgreement = findDemoAgreement(data, id);
  if (!initialAgreement) notFound();

  return (
    <main className="max-w-5xl">
      <DemoPreviewBanner />
      <header className="mb-5">
        <SalesSubnav current="agreements" />
      </header>
      <AgreementEditor initialAgreement={initialAgreement} mode="edit" />
    </main>
  );
}
