import { notFound } from "next/navigation";

import { OrganizationDetail } from "@/components/admin/organization-detail";
import { loadDemoCrmData } from "@/lib/demo/data";
import { demoOrganizationBundle } from "@/lib/demo/map-to-crm";

export const metadata = {
  title: "Demo Business",
  robots: { index: false, follow: false },
};

export default async function DemoOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadDemoCrmData();
  const bundle = demoOrganizationBundle(data, id);
  if (!bundle) notFound();

  return (
    <main>
      <OrganizationDetail
        activities={bundle.activities}
        agreements={bundle.agreements}
        invoices={bundle.invoices}
        leads={bundle.leads}
        organization={bundle.organization}
        projects={bundle.projects}
        proposals={bundle.proposals}
        purchases={bundle.purchases}
        readOnly
      />
    </main>
  );
}
