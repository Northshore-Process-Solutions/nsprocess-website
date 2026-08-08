import { SettingsNavList } from "@/components/admin/settings-nav-list";
import { getAppBrand } from "@/lib/app-brand";
import { createClient } from "@/lib/supabase/server";

function preview(value: string | null | undefined, empty = "Not set") {
  const trimmed = value?.trim();
  if (!trimmed) return empty;
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed;
}

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

  return (
    <SettingsNavList
      groups={[
        {
          label: "Portal",
          items: [
            {
              href: "/crm/settings/site/portal",
              title: "Portal label",
              description: "Name shown in the CRM header and login screen.",
              meta: brand.portalName,
            },
          ],
        },
        {
          label: "AI",
          items: [
            {
              href: "/crm/settings/site/ai/context",
              title: "Shared context",
              description:
                "What you sell / industry — used by all AI drafts.",
              meta: preview(aiRow?.ai_industry),
            },
            {
              href: "/crm/settings/site/ai/proposals",
              title: "Proposal generation",
              description: "Instructions for scope and line-item drafts.",
              meta: preview(
                aiRow?.ai_proposal_instructions,
                "Using defaults",
              ),
            },
            {
              href: "/crm/settings/site/ai/replies",
              title: "Email replies",
              description: "Instructions for outbound lead reply drafts.",
              meta: preview(aiRow?.ai_reply_instructions, "Using defaults"),
            },
          ],
        },
      ]}
    />
  );
}
