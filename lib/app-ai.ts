import {
  fallbackAppBrand,
  type AppBrand,
  type AppSettingsRow,
  appBrandFromRow,
} from "@/lib/app-brand";
import { createClient } from "@/lib/supabase/server";

export type AppAiSettings = {
  industry: string | null;
  proposalInstructions: string | null;
  replyInstructions: string | null;
};

export type AppAiConfig = {
  brand: AppBrand;
  /** Resolved industry string always ready for prompts. */
  industry: string;
  proposalInstructions: string | null;
  replyInstructions: string | null;
  operatorName: string;
};

type AiSettingsRow = AppSettingsRow & {
  ai_industry: string | null;
  ai_proposal_instructions: string | null;
  ai_reply_instructions: string | null;
};

const AI_SETTINGS_SELECT =
  "company_name, portal_name, tagline, phone, email, service_area, logo_path, ai_industry, ai_proposal_instructions, ai_reply_instructions";

function isCrmOnly() {
  return process.env.CRM_ONLY === "1" || process.env.CRM_ONLY === "true";
}

export function defaultAiIndustry(brand: AppBrand): string {
  if (process.env.AI_INDUSTRY?.trim()) {
    return process.env.AI_INDUSTRY.trim();
  }

  if (!isCrmOnly()) {
    return "local business-efficiency consultancy on the Massachusetts North Shore";
  }

  if (brand.serviceArea?.trim()) {
    return `local service business serving ${brand.serviceArea.trim()}`;
  }

  return "local service business";
}

export function appAiFromRow(row: AiSettingsRow): {
  brand: AppBrand;
  ai: AppAiSettings;
} {
  return {
    brand: appBrandFromRow(row),
    ai: {
      industry: row.ai_industry?.trim() || null,
      proposalInstructions: row.ai_proposal_instructions?.trim() || null,
      replyInstructions: row.ai_reply_instructions?.trim() || null,
    },
  };
}

export function resolveAppAiConfig(
  brand: AppBrand,
  ai: AppAiSettings,
): AppAiConfig {
  return {
    brand,
    operatorName: brand.companyName,
    industry: ai.industry?.trim() || defaultAiIndustry(brand),
    proposalInstructions: ai.proposalInstructions?.trim() || null,
    replyInstructions: ai.replyInstructions?.trim() || null,
  };
}

/** Brand + AI prompt preferences for live CRM assistants. */
export async function getAppAiConfig(): Promise<AppAiConfig> {
  const fromUserClient = await loadAiConfigWithUserClient();
  if (fromUserClient) return fromUserClient;

  const fromServiceRole = await loadAiConfigWithServiceRole();
  if (fromServiceRole) return fromServiceRole;

  const brand = fallbackAppBrand();
  return resolveAppAiConfig(brand, {
    industry: null,
    proposalInstructions: null,
    replyInstructions: null,
  });
}

async function loadAiConfigWithUserClient(): Promise<AppAiConfig | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select(AI_SETTINGS_SELECT)
      .eq("id", true)
      .maybeSingle();

    if (error) {
      console.error("getAppAiConfig user client failed", error.message);
      return null;
    }
    if (!data) return null;

    const { brand, ai } = appAiFromRow(data as AiSettingsRow);
    return resolveAppAiConfig(brand, ai);
  } catch (error) {
    console.error("getAppAiConfig user client threw", error);
    return null;
  }
}

async function loadAiConfigWithServiceRole(): Promise<AppAiConfig | null> {
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/admin");
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("app_settings")
      .select(AI_SETTINGS_SELECT)
      .eq("id", true)
      .maybeSingle();

    if (error) {
      console.error("getAppAiConfig service role failed", error.message);
      return null;
    }
    if (!data) return null;

    const { brand, ai } = appAiFromRow(data as AiSettingsRow);
    return resolveAppAiConfig(brand, ai);
  } catch (error) {
    console.error("getAppAiConfig service role threw", error);
    return null;
  }
}

/** Build extraSystemRules from saved custom instructions (+ optional extras). */
export function buildAiExtraRules(
  customInstructions: string | null | undefined,
  ...extras: Array<string | null | undefined>
) {
  const parts = [
    customInstructions?.trim()
      ? `OPERATOR INSTRUCTIONS (required — override any conflicting guidance below):\n${customInstructions.trim()}`
      : null,
    ...extras.map((item) => item?.trim() || null),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}
