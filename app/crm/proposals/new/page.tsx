import { redirect } from "next/navigation";

import { SalesSubnav } from "@/components/admin/sales-subnav";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import {
  mapOrganizationToCrmRow,
  ORGANIZATION_DOCUMENT_SELECT,
  organizationDocumentDefaults,
  type OrganizationRow,
} from "@/lib/crm";
import type { LeadRow } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

type NewProposalPageProps = {
  searchParams?: Promise<{
    leadId?: string;
    organizationId?: string;
  }>;
};

export default async function NewProposalPage({
  searchParams,
}: NewProposalPageProps) {
  const params = await searchParams;
  const leadId = params?.leadId;
  const organizationId = params?.organizationId;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  let lead: LeadRow | null = null;
  if (leadId) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load lead: ${error.message}`);
    }
    lead = (data as LeadRow | null) ?? null;
  }

  let organizationDefaults: ReturnType<typeof organizationDocumentDefaults> | undefined;

  if (!lead && organizationId) {
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
      <header className="mb-5">
        <SalesSubnav current="proposals" />
      </header>

      <ProposalEditor
        defaults={
          lead
            ? {
                leadId: lead.id,
                organizationId: lead.organization_id,
                clientBusinessName: lead.business_name,
                clientContactName: lead.contact_name,
                clientEmail: lead.email,
                clientPhone: lead.phone,
                title: "Process Improvement Proposal",
              }
            : organizationDefaults
        }
        mode="create"
      />
    </main>
  );
}
