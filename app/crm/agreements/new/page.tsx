import { redirect } from "next/navigation";

import { createAgreementFromProposal } from "@/app/crm/agreements/actions";
import { AgreementEditor } from "@/components/admin/agreement-editor";
import {
  mapOrganizationToCrmRow,
  ORGANIZATION_DOCUMENT_SELECT,
  organizationDocumentDefaults,
  type OrganizationRow,
} from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

type NewAgreementPageProps = {
  searchParams?: Promise<{
    proposalId?: string;
    organizationId?: string;
  }>;
};

export default async function NewAgreementPage({
  searchParams,
}: NewAgreementPageProps) {
  const params = await searchParams;
  const proposalId = params?.proposalId;
  const organizationId = params?.organizationId;

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

  let organizationDefaults: ReturnType<typeof organizationDocumentDefaults> | undefined;

  if (organizationId) {
    const { data, error } = await supabase
      .from("organizations")
      .select(ORGANIZATION_DOCUMENT_SELECT)
      .eq("id", organizationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load business: ${error.message}`);
    }

    if (data) {
      organizationDefaults = organizationDocumentDefaults(
        mapOrganizationToCrmRow(data as unknown as OrganizationRow),
      );
    }
  }

  return (
    <main>
      <AgreementEditor defaults={organizationDefaults} mode="create" />
    </main>
  );
}
