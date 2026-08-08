import { redirect } from "next/navigation";

import { AiSettingsForm } from "@/components/admin/ai-settings-form";
import { BrandSettingsForm } from "@/components/admin/brand-settings-form";
import {
  defaultAiIndustry,
  type AppAiSettings,
} from "@/lib/app-ai";
import { getAppBrand } from "@/lib/app-brand";
import { createClient } from "@/lib/supabase/server";

export default async function CrmSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/crm/login?next=/crm/settings");
  }

  const brand = await getAppBrand();

  const { data: aiRow } = await supabase
    .from("app_settings")
    .select("ai_industry, ai_custom_instructions")
    .eq("id", true)
    .maybeSingle();

  const aiSettings: AppAiSettings = {
    industry: aiRow?.ai_industry?.trim() || null,
    customInstructions: aiRow?.ai_custom_instructions?.trim() || null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how your company appears in the CRM and how AI drafts
          proposals and replies.
        </p>
      </div>
      <BrandSettingsForm brand={brand} />
      <div className="mx-auto w-full max-w-2xl">
        <AiSettingsForm
          companyName={brand.companyName}
          industryPlaceholder={defaultAiIndustry(brand)}
          settings={aiSettings}
        />
      </div>
    </div>
  );
}
