import { AiSpamSettingsForm } from "@/components/admin/ai-settings-form";
import { SettingsDetailShell } from "@/components/admin/settings-nav-list";
import { createClient } from "@/lib/supabase/server";

export default async function CrmAiSpamSettingsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("ai_spam_instructions")
    .eq("id", true)
    .maybeSingle();

  return (
    <SettingsDetailShell
      backHref="/crm/settings/site"
      backLabel="Site settings"
      description="Applied when new inquiries arrive. Flags possible spam or ads on the pipeline."
      title="Spam detection"
    >
      <AiSpamSettingsForm
        instructions={data?.ai_spam_instructions?.trim() || null}
      />
    </SettingsDetailShell>
  );
}
