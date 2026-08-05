import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import type { LeadRow } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

type NewProposalPageProps = {
  searchParams?: Promise<{
    leadId?: string;
  }>;
};

export default async function NewProposalPage({
  searchParams,
}: NewProposalPageProps) {
  const params = await searchParams;
  const leadId = params?.leadId;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
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
        defaults={
          lead
            ? {
                leadId: lead.id,
                organizationId: lead.organization_id,
                clientBusinessName: lead.business_name,
                clientContactName: lead.contact_name,
                clientEmail: lead.email,
                clientPhone: lead.phone,
                title: `${lead.business_name} — Process Improvement Proposal`,
              }
            : undefined
        }
        mode="create"
      />
    </main>
  );
}
