import { AiProposalSettingsForm } from "@/components/admin/ai-settings-form";
import { SettingsDetailShell } from "@/components/admin/settings-nav-list";
import { createClient } from "@/lib/supabase/server";

export default async function CrmAiProposalSettingsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("ai_proposal_instructions")
    .eq("id", true)
    .maybeSingle();

  return (
    <SettingsDetailShell
      backHref="/crm/settings/site"
      backLabel="Site settings"
      description="Applied only when drafting proposal scope and line items."
      title="Proposal generation"
    >
      <AiProposalSettingsForm
        instructions={data?.ai_proposal_instructions?.trim() || null}
      />
    </SettingsDetailShell>
  );
}
