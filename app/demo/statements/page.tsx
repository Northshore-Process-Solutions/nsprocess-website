import { BillingSubnav } from "@/components/admin/billing-subnav";
import { StatementForm } from "@/components/admin/statement-form";
import { loadDemoCrmData } from "@/lib/demo/data";

export const metadata = {
  title: "Demo Statements",
  robots: { index: false, follow: false },
};

type DemoStatementsPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
  }>;
};

export default async function DemoStatementsPage({
  searchParams,
}: DemoStatementsPageProps) {
  const params = await searchParams;
  const data = await loadDemoCrmData();

  const organizations = data.organizations.map((org) => ({
    id: org.id,
    name: org.name,
  }));

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Statements
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Generate a printable account statement for a business over a date range.
          Demo uses seeded invoices from your session — not live billing data.
        </p>
        <BillingSubnav current="statements" />
      </header>

      <div className="max-w-2xl">
        <StatementForm
          defaultOrganizationId={params?.organizationId}
          organizations={organizations}
        />
      </div>
    </main>
  );
}
