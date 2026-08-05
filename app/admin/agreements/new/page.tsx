import { redirect } from "next/navigation";

import { createAgreementFromProposal } from "@/app/admin/agreements/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { AgreementEditor } from "@/components/admin/agreement-editor";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
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
    redirect("/admin/login");
  }

  if (proposalId) {
    const result = await createAgreementFromProposal(proposalId);
    if (!result.ok || !result.id) {
      throw new Error(result.error ?? "Failed to create agreement from proposal.");
    }
    redirect(`/admin/agreements/${result.id}`);
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

      <AgreementEditor mode="create" />
    </main>
  );
}
