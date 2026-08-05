import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { AgreementEditor } from "@/components/admin/agreement-editor";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import type { AgreementWithItems } from "@/lib/agreements";
import { createClient } from "@/lib/supabase/server";

type AgreementPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AgreementPage({ params }: AgreementPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("agreements")
    .select(
      `
      *,
      agreement_items (
        id,
        agreement_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      ),
      proposals (
        id,
        proposal_number,
        title
      ),
      organizations (
        id,
        name
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load agreement: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="billing" />
        </div>
        <SignOutButton />
      </header>

      <AgreementEditor
        initialAgreement={data as AgreementWithItems}
        mode="edit"
      />
    </main>
  );
}
