import { generateObject } from "ai";
import { z } from "zod";

import { getDraftModel } from "@/lib/ai/openai";
import { buildAiExtraRules, type AppAiConfig } from "@/lib/app-ai";

const spamSchema = z.object({
  isSpam: z
    .boolean()
    .describe(
      "True when the inquiry looks like spam, ads, SEO pitches, unrelated solicitations, or mass outreach — not a genuine prospect.",
    ),
  reason: z
    .string()
    .describe(
      "One short sentence explaining the spam signal. Empty string when isSpam is false.",
    ),
});

export type LeadSpamInput = {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  source?: string | null;
  message?: string | null;
  notes?: string | null;
};

export type LeadSpamClassification =
  | { ok: true; isSpam: boolean; reason: string | null }
  | { ok: false; error: string };

export async function classifyLeadSpam(
  input: LeadSpamInput,
  ai: Pick<AppAiConfig, "industry" | "operatorName" | "spamInstructions">,
): Promise<LeadSpamClassification> {
  const system = [
    buildAiExtraRules(ai.spamInstructions),
    `You classify inbound CRM inquiries for ${ai.operatorName}, a ${ai.industry} business.`,
    `Mark isSpam true only when the message is clearly spam, advertising, SEO/link-building pitches, unrelated B2B solicitations, crypto/scams, or generic mass outreach — not a genuine local prospect.`,
    `Do NOT mark as spam: real questions about services, process reviews, scheduling, referrals, or vague but legitimate business inquiries.`,
    `When isSpam is true, reason must be one concise sentence (max ~20 words). When false, reason must be an empty string.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { object } = await generateObject({
      model: getDraftModel(),
      schema: spamSchema,
      system,
      prompt: [
        `Business: ${input.businessName}`,
        `Contact: ${input.contactName}`,
        `Email: ${input.email}`,
        input.phone ? `Phone: ${input.phone}` : null,
        input.title ? `Title: ${input.title}` : null,
        input.source ? `Source: ${input.source}` : null,
        input.message ? `Inquiry message:\n${input.message}` : "Inquiry message: (none)",
        input.notes ? `Internal notes:\n${input.notes}` : null,
        "Classify this inquiry.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const reason = object.reason.trim();
    return {
      ok: true,
      isSpam: object.isSpam,
      reason: object.isSpam && reason ? reason : null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to classify inquiry.";
    return { ok: false, error: message };
  }
}
