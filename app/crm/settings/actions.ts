"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type BrandSettingsInput = {
  companyName: string;
  tagline?: string;
  phone?: string;
  email?: string;
  serviceArea?: string;
};

export type PortalSettingsInput = {
  portalName: string;
};

export type AiIndustrySettingsInput = {
  industry?: string;
};

export type AiProposalSettingsInput = {
  proposalInstructions?: string;
};

export type AiAgreementSettingsInput = {
  agreementInstructions?: string;
};

export type AiReplySettingsInput = {
  replyInstructions?: string;
};

export type AiSpamSettingsInput = {
  spamInstructions?: string;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
};

const MAX_AI_INDUSTRY = 500;
const MAX_AI_INSTRUCTIONS = 4000;

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveBrandSettings(
  input: BrandSettingsInput,
): Promise<ActionResult> {
  const companyName = input.companyName.trim();

  if (!companyName) {
    return { ok: false, error: "Company name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data: existing } = await supabase
    .from("app_settings")
    .select("portal_name, logo_path")
    .eq("id", true)
    .maybeSingle();

  const portalName =
    existing?.portal_name?.trim() ||
    process.env.PORTAL_NAME?.trim() ||
    companyName;

  const payload = {
    id: true,
    company_name: companyName,
    portal_name: portalName,
    tagline: clean(input.tagline),
    phone: clean(input.phone),
    email: clean(input.email),
    service_area: clean(input.serviceArea),
    logo_path: existing?.logo_path ?? null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await supabase.from("app_settings").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm", "layout");
  revalidatePath("/crm/settings");
  revalidatePath("/crm/login");
  return { ok: true };
}

export async function savePortalSettings(
  input: PortalSettingsInput,
): Promise<ActionResult> {
  const portalName = input.portalName.trim();
  if (!portalName) {
    return { ok: false, error: "Portal label is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data: existing } = await supabase
    .from("app_settings")
    .select(
      "company_name, tagline, phone, email, service_area, logo_path, ai_industry, ai_proposal_instructions, ai_agreement_instructions, ai_reply_instructions, ai_spam_instructions",
    )
    .eq("id", true)
    .maybeSingle();

  const companyName =
    existing?.company_name?.trim() ||
    process.env.COMPANY_NAME?.trim() ||
    "Your Company";

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: true,
      company_name: companyName,
      portal_name: portalName,
      tagline: existing?.tagline ?? null,
      phone: existing?.phone ?? null,
      email: existing?.email ?? null,
      service_area: existing?.service_area ?? null,
      logo_path: existing?.logo_path ?? null,
      ai_industry: existing?.ai_industry ?? null,
      ai_proposal_instructions: existing?.ai_proposal_instructions ?? null,
      ai_agreement_instructions: existing?.ai_agreement_instructions ?? null,
      ai_reply_instructions: existing?.ai_reply_instructions ?? null,
      ai_spam_instructions: existing?.ai_spam_instructions ?? null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm", "layout");
  revalidatePath("/crm/settings");
  revalidatePath("/crm/login");
  return { ok: true };
}

export async function uploadBrandLogo(
  formData: FormData,
): Promise<ActionResult & { logoUrl?: string }> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file to upload." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Logo must be 2MB or smaller." };
  }

  const allowed = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "image/gif",
  ];
  if (!allowed.includes(file.type)) {
    return {
      ok: false,
      error: "Use a PNG, JPEG, WebP, SVG, or GIF image.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/svg+xml"
            ? "svg"
            : "gif";

  const path = `logo.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data: existing } = await supabase
    .from("app_settings")
    .select(
      "company_name, portal_name, tagline, phone, email, service_area",
    )
    .eq("id", true)
    .maybeSingle();

  const companyName =
    existing?.company_name?.trim() ||
    process.env.COMPANY_NAME?.trim() ||
    "Your Company";
  const portalName =
    existing?.portal_name?.trim() ||
    process.env.PORTAL_NAME?.trim() ||
    "CRM";

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: true,
      company_name: companyName,
      portal_name: portalName,
      tagline: existing?.tagline ?? null,
      phone: existing?.phone ?? null,
      email: existing?.email ?? null,
      service_area: existing?.service_area ?? null,
      logo_path: path,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("branding").getPublicUrl(path);

  revalidatePath("/crm", "layout");
  revalidatePath("/crm/settings");
  return { ok: true, logoUrl: `${publicUrl}?v=${Date.now()}` };
}

export async function clearBrandLogo(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data: existing } = await supabase
    .from("app_settings")
    .select(
      "company_name, portal_name, tagline, phone, email, service_area, logo_path",
    )
    .eq("id", true)
    .maybeSingle();

  if (!existing) {
    return { ok: true };
  }

  if (existing.logo_path) {
    await supabase.storage.from("branding").remove([existing.logo_path]);
  }

  const { error } = await supabase
    .from("app_settings")
    .update({
      logo_path: null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", true);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm", "layout");
  revalidatePath("/crm/settings");
  return { ok: true };
}

export async function saveAiIndustrySettings(
  input: AiIndustrySettingsInput,
): Promise<ActionResult> {
  const industry = clean(input.industry);

  if (industry && industry.length > MAX_AI_INDUSTRY) {
    return {
      ok: false,
      error: `Industry description must be ${MAX_AI_INDUSTRY} characters or fewer.`,
    };
  }

  return patchAiFields({ ai_industry: industry });
}

export async function saveAiProposalSettings(
  input: AiProposalSettingsInput,
): Promise<ActionResult> {
  const proposalInstructions = clean(input.proposalInstructions);

  if (proposalInstructions && proposalInstructions.length > MAX_AI_INSTRUCTIONS) {
    return {
      ok: false,
      error: `Proposal instructions must be ${MAX_AI_INSTRUCTIONS} characters or fewer.`,
    };
  }

  return patchAiFields({
    ai_proposal_instructions: proposalInstructions,
  });
}

export async function saveAiAgreementSettings(
  input: AiAgreementSettingsInput,
): Promise<ActionResult> {
  const agreementInstructions = clean(input.agreementInstructions);

  if (
    agreementInstructions &&
    agreementInstructions.length > MAX_AI_INSTRUCTIONS
  ) {
    return {
      ok: false,
      error: `Agreement instructions must be ${MAX_AI_INSTRUCTIONS} characters or fewer.`,
    };
  }

  return patchAiFields({
    ai_agreement_instructions: agreementInstructions,
  });
}

export async function saveAiReplySettings(
  input: AiReplySettingsInput,
): Promise<ActionResult> {
  const replyInstructions = clean(input.replyInstructions);

  if (replyInstructions && replyInstructions.length > MAX_AI_INSTRUCTIONS) {
    return {
      ok: false,
      error: `Reply instructions must be ${MAX_AI_INSTRUCTIONS} characters or fewer.`,
    };
  }

  return patchAiFields({
    ai_reply_instructions: replyInstructions,
  });
}

export async function saveAiSpamSettings(
  input: AiSpamSettingsInput,
): Promise<ActionResult> {
  const spamInstructions = clean(input.spamInstructions);

  if (spamInstructions && spamInstructions.length > MAX_AI_INSTRUCTIONS) {
    return {
      ok: false,
      error: `Spam detection instructions must be ${MAX_AI_INSTRUCTIONS} characters or fewer.`,
    };
  }

  return patchAiFields({
    ai_spam_instructions: spamInstructions,
  });
}

async function patchAiFields(
  fields: Record<string, string | null>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data: existing } = await supabase
    .from("app_settings")
    .select(
      "company_name, portal_name, tagline, phone, email, service_area, logo_path, ai_industry, ai_proposal_instructions, ai_agreement_instructions, ai_reply_instructions, ai_spam_instructions",
    )
    .eq("id", true)
    .maybeSingle();

  const companyName =
    existing?.company_name?.trim() ||
    process.env.COMPANY_NAME?.trim() ||
    "Your Company";
  const portalName =
    existing?.portal_name?.trim() ||
    process.env.PORTAL_NAME?.trim() ||
    "CRM";

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: true,
      company_name: companyName,
      portal_name: portalName,
      tagline: existing?.tagline ?? null,
      phone: existing?.phone ?? null,
      email: existing?.email ?? null,
      service_area: existing?.service_area ?? null,
      logo_path: existing?.logo_path ?? null,
      ai_industry: existing?.ai_industry ?? null,
      ai_proposal_instructions: existing?.ai_proposal_instructions ?? null,
      ai_agreement_instructions: existing?.ai_agreement_instructions ?? null,
      ai_reply_instructions: existing?.ai_reply_instructions ?? null,
      ai_spam_instructions: existing?.ai_spam_instructions ?? null,
      ...fields,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm/settings");
  return { ok: true };
}
