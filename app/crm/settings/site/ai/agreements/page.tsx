import { AiAgreementSettingsForm } from "@/components/admin/ai-settings-form";
import { SettingsDetailShell } from "@/components/admin/settings-nav-list";
import { createClient } from "@/lib/supabase/server";

export default async function CrmAiAgreementSettingsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("ai_agreement_instructions")
    .eq("id", true)
    .maybeSingle();

  return (
    <SettingsDetailShell
      backHref="/crm/settings/site"
      backLabel="Site settings"
      description="Applied only when drafting agreement scope and line items."
      title="Agreement generation"
    >
      <AiAgreementSettingsForm
        instructions={data?.ai_agreement_instructions?.trim() || null}
      />
    </SettingsDetailShell>
  );
}
