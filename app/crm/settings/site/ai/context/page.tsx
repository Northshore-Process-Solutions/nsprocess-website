import { AiIndustrySettingsForm } from "@/components/admin/ai-settings-form";
import { SettingsDetailShell } from "@/components/admin/settings-nav-list";
import { defaultAiIndustry } from "@/lib/app-ai";
import { getAppBrand } from "@/lib/app-brand";
import { createClient } from "@/lib/supabase/server";

export default async function CrmAiContextSettingsPage() {
  const supabase = await createClient();
  const brand = await getAppBrand();

  const { data } = await supabase
    .from("app_settings")
    .select("ai_industry")
    .eq("id", true)
    .maybeSingle();

  return (
    <SettingsDetailShell
      backHref="/crm/settings/site"
      backLabel="Site settings"
      description={`Used by proposal and agreement generation and email replies. Company name comes from Company settings (${brand.companyName}).`}
      title="Shared AI context"
    >
      <AiIndustrySettingsForm
        industry={data?.ai_industry?.trim() || null}
        industryPlaceholder={defaultAiIndustry(brand)}
      />
    </SettingsDetailShell>
  );
}
