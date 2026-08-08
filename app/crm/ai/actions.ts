"use server";

import { generateText } from "ai";

import {
  generateProposalDraft,
  type DraftProposalLineItem,
} from "@/lib/ai/draft-proposal";
import { getDraftModel } from "@/lib/ai/openai";
import { buildAiExtraRules, getAppAiConfig } from "@/lib/app-ai";
import { requireReadyDemoSession } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

export type AiActionResult = {
  ok: boolean;
  text?: string;
  items?: DraftProposalLineItem[];
  error?: string;
};

async function requireCrmUserOrDemo() {
  const demo = await requireReadyDemoSession();
  if (demo.session?.seed) {
    return {
      error: null as null,
      demoSeed: demo.session.seed,
    };
  }

  // Cookie present but session not usable — don't fall through to CRM auth.
  if (demo.error && demo.error !== "No demo session.") {
    return {
      error:
        demo.error === "Demo session expired."
          ? ("Your demo session expired. Start a new demo to continue." as const)
          : ("Demo session is not ready. Return to the demo home and try again." as const),
      demoSeed: null,
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return {
      error: "You must be signed in." as const,
      demoSeed: null,
    };
  }

  return { error: null as null, demoSeed: null };
}

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function draftProposalScope(input: {
  businessName?: string;
  contactName?: string;
  title?: string;
  notes?: string;
  existingScope?: string;
  existingItems?: DraftProposalLineItem[];
}): Promise<AiActionResult> {
  const auth = await requireCrmUserOrDemo();
  if (auth.error) return { ok: false, error: auth.error };

  const demoCompany = auth.demoSeed?.business;
  let operatorName: string;
  let industry: string;
  let extraSystemRules: string | undefined;
  let emptyNotesFallback: string;

  if (auth.demoSeed) {
    industry =
      demoCompany?.category?.trim() ||
      demoCompany?.notes?.trim() ||
      "local service business";
    operatorName = demoCompany?.name?.trim() || "the service company";
    extraSystemRules = buildAiExtraRules(
      null,
      "Do not write as if you are North Shore Process Solutions unless that is the demo company.",
    );
    emptyNotesFallback = `No consult notes were provided. Draft a general ${industry} job/engagement scope and matching line items suitable for this client type, kept intentionally non-specific.`;
  } else {
    const ai = await getAppAiConfig();
    operatorName = ai.operatorName;
    industry = ai.industry;
    extraSystemRules = buildAiExtraRules(ai.proposalInstructions);
    emptyNotesFallback = `No consult notes were provided. Draft a general ${industry} engagement scope and matching line items suitable for a typical client of ${operatorName}, kept intentionally non-specific.`;
  }

  const result = await generateProposalDraft({
    operatorName,
    industry,
    businessName: input.businessName,
    contactName: input.contactName,
    title: input.title,
    notes: input.notes,
    existingScope: input.existingScope,
    existingItems: input.existingItems,
    extraSystemRules,
    emptyNotesFallback,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    text: result.scopeSummary,
    items: result.items,
  };
}

export async function optimizeLeadReply(input: {
  businessName?: string;
  contactName?: string;
  email?: string;
  title?: string;
  message?: string;
  notes?: string;
  existingBody?: string;
}): Promise<AiActionResult> {
  const auth = await requireCrmUserOrDemo();
  if (auth.error) return { ok: false, error: auth.error };

  const businessName = clean(input.businessName) ?? "the business";
  const contactName = clean(input.contactName) ?? "there";
  const firstName = contactName.trim().split(/\s+/)[0] || "there";
  const title = clean(input.title) ?? "Free Process Review";
  const inquiry = clean(input.message);
  const notes = clean(input.notes);
  const existingBody = clean(input.existingBody);

  const demoCompany = auth.demoSeed?.business;
  let operatorName: string;
  let industry: string;
  let nextStepHint: string;
  let preferenceBlock = "";

  if (auth.demoSeed) {
    industry =
      demoCompany?.category?.trim() ||
      demoCompany?.notes?.trim() ||
      "local service business";
    operatorName = demoCompany?.name?.trim() || "the service company";
    nextStepHint =
      "Suggest one clear next step (call, visit, or process review) without pressure.";
    preferenceBlock =
      "\nDo not write as if you are North Shore Process Solutions unless that is the demo company.";
  } else {
    const ai = await getAppAiConfig();
    operatorName = ai.operatorName;
    industry = ai.industry;
    nextStepHint =
      "Suggest one clear next step appropriate for this business without pressure.";
    if (ai.replyInstructions) {
      preferenceBlock = `\nOperator preferences (follow when compatible):\n${ai.replyInstructions}`;
    }
  }

  const system = `You write short outbound reply emails for ${operatorName}, a ${industry} business.

Voice: calm, practical, friendly, plain English. No hype, no emojis, no markdown.
Output: a complete plain-text email body only (greeting + 2–4 short paragraphs + simple sign-off).
Keep it under 180 words.
Reference the inquiry naturally when provided.
${nextStepHint}
Do not invent prices, schedules, or facts that were not provided.
Do not include a subject line.${preferenceBlock}`;

  try {
    const { text } = await generateText({
      model: getDraftModel(),
      system,
      prompt: [
        `Lead / inquiry title: ${title}`,
        `Client business: ${businessName}`,
        `Contact: ${contactName}`,
        input.email ? `Contact email: ${input.email}` : null,
        inquiry ? `Their inquiry message:\n${inquiry}` : null,
        notes ? `Internal notes:\n${notes}` : null,
        existingBody
          ? `Current draft to improve (keep the writer's intent; tighten clarity and tone):\n${existingBody}`
          : `No draft yet. Write a fresh reply starting with "Hi ${firstName},"`,
        existingBody
          ? "Optimize the draft now. Preserve any specific commitments the writer already made."
          : "Write the reply email now.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const drafted = text.trim();
    if (!drafted) {
      return { ok: false, error: "AI returned an empty draft." };
    }

    return { ok: true, text: drafted };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to optimize with AI.";
    return { ok: false, error: message };
  }
}
