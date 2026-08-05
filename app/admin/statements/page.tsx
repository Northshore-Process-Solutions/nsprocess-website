import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { BillingSubnav } from "@/components/admin/billing-subnav";
import { StatementForm } from "@/components/admin/statement-form";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
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
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error(`Failed to load businesses: ${error.message}`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="billing" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Statements
          </h1>
          <p className="mt-2 text-muted-foreground">
            Generate a printable account statement for a business over a date
            range.
          </p>
          <BillingSubnav current="statements" />
        </div>
        <SignOutButton />
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
