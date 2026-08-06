import { redirect } from "next/navigation";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { StatementForm } from "@/components/admin/statement-form";
import { createClient } from "@/lib/supabase/server";

type StatementsPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
  }>;
};

export default async function StatementsPage({
  searchParams,
}: StatementsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error(`Failed to load businesses: ${error.message}`);
  }

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Statements
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Generate a printable account statement for a business over a date range.
        </p>
        <BillingSubnav current="statements" />
      </header>

      <div className="max-w-2xl">
        <StatementForm
          defaultOrganizationId={params?.organizationId}
          organizations={data ?? []}
        />
      </div>
    </main>
  );
}
