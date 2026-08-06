import { notFound, redirect } from "next/navigation";

import { AgreementEditor } from "@/components/admin/agreement-editor";
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
    redirect("/crm/login");
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
    <main className="max-w-5xl">

      <AgreementEditor
        initialAgreement={data as AgreementWithItems}
        mode="edit"
      />
    </main>
  );
}
