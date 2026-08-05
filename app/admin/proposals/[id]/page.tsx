import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
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
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="proposals" />
        </div>
        <SignOutButton />
      </header>

      <ProposalEditor
        initialProposal={data as ProposalWithItems}
        mode="edit"
      />
    </main>
  );
}
