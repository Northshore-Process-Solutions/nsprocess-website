import { AiSettingsForm } from "@/components/admin/ai-settings-form";
import { PortalSettingsForm } from "@/components/admin/portal-settings-form";
import {
  defaultAiIndustry,
  type AppAiSettings,
} from "@/lib/app-ai";
import { getAppBrand } from "@/lib/app-brand";
import { createClient } from "@/lib/supabase/server";

export default async function CrmSiteSettingsPage() {
  const supabase = await createClient();
  const brand = await getAppBrand();

  const { data: aiRow } = await supabase
    .from("app_settings")
    .select(
      "ai_industry, ai_proposal_instructions, ai_reply_instructions",
    )
    .eq("id", true)
    .maybeSingle();

  const aiSettings: AppAiSettings = {
    industry: aiRow?.ai_industry?.trim() || null,
    proposalInstructions: aiRow?.ai_proposal_instructions?.trim() || null,
    replyInstructions: aiRow?.ai_reply_instructions?.trim() || null,
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PortalSettingsForm portalName={brand.portalName} />
      <AiSettingsForm
        companyName={brand.companyName}
        industryPlaceholder={defaultAiIndustry(brand)}
        settings={aiSettings}
      />
    </div>
  );
}
