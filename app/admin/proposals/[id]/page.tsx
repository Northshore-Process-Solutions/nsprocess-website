import { notFound, redirect } from "next/navigation";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import type { ProposalWithItems } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";

type ProposalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      *,
      proposal_items (
        id,
        proposal_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      ),
      leads (
        id,
        business_name,
        stage
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
    throw new Error(`Failed to load proposal: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  return (
    <main className="max-w-5xl">
      <header className="mb-5">
        <BillingSubnav current="proposals" />
      </header>

      <ProposalEditor
        initialProposal={data as ProposalWithItems}
        mode="edit"
      />
    </main>
  );
}
