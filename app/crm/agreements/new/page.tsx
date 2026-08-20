import { redirect } from "next/navigation";

import { createAgreementFromProposal } from "@/app/crm/agreements/actions";
import { AgreementEditor } from "@/components/admin/agreement-editor";
import { createClient } from "@/lib/supabase/server";

type NewAgreementPageProps = {
  searchParams?: Promise<{
    proposalId?: string;
  }>;
};

export default async function NewAgreementPage({
  searchParams,
}: NewAgreementPageProps) {
  const params = await searchParams;
  const proposalId = params?.proposalId;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  if (proposalId) {
    const result = await createAgreementFromProposal(proposalId);
    if (!result.ok || !result.id) {
      throw new Error(result.error ?? "Failed to create agreement from proposal.");
    }
    redirect(`/crm/agreements/${result.id}`);
  }

  return (
    <main>
      <AgreementEditor mode="create" />
    </main>
  );
}
