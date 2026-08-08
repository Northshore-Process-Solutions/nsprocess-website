import { AiReplySettingsForm } from "@/components/admin/ai-settings-form";
import { SettingsDetailShell } from "@/components/admin/settings-nav-list";
import { createClient } from "@/lib/supabase/server";

export default async function CrmAiReplySettingsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("ai_reply_instructions")
    .eq("id", true)
    .maybeSingle();

  return (
    <SettingsDetailShell
      backHref="/crm/settings/site"
      backLabel="Site settings"
      description="Applied only when optimizing outbound lead reply emails."
      title="Email replies"
    >
      <AiReplySettingsForm
        instructions={data?.ai_reply_instructions?.trim() || null}
      />
    </SettingsDetailShell>
  );
}
