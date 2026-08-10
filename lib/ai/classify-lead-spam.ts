import { generateObject } from "ai";
import { z } from "zod";

import { getDraftModel } from "@/lib/ai/openai";
import { type AppAiConfig } from "@/lib/app-ai";

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

function contactLastName(contactName: string) {
  const parts = contactName.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

function buildSpamSchema(hasOperatorRules: boolean) {
  return z.object({
    isSpam: z.boolean().describe(
      hasOperatorRules
        ? "True when operator instructions say to flag this inquiry, or when it clearly matches default spam/ad/solicitation signals."
        : "True when the inquiry looks like spam, ads, SEO pitches, unrelated solicitations, or mass outreach — not a genuine prospect.",
    ),
    reason: z.string().describe(
      "One short sentence explaining why it was flagged. Empty string when isSpam is false.",
    ),
  });
}

export async function classifyLeadSpam(
  input: LeadSpamInput,
  ai: Pick<AppAiConfig, "industry" | "operatorName" | "spamInstructions">,
): Promise<LeadSpamClassification> {
  const operatorRules = ai.spamInstructions?.trim() || null;
  const hasOperatorRules = Boolean(operatorRules);
  const lastName = contactLastName(input.contactName);

  const system = [
    hasOperatorRules
      ? `OPERATOR INSTRUCTIONS (required — these override any conflicting guidance below):\n${operatorRules}`
      : null,
    `You classify inbound CRM inquiries for ${ai.operatorName}, a ${ai.industry} business.`,
    hasOperatorRules
      ? "When operator instructions define flagging rules, apply them strictly — including rules based on contact name, last name, email, domain, message content, source, or other inquiry fields."
      : null,
    hasOperatorRules
      ? "Default spam signals apply only when operator instructions do not cover the case: advertising, SEO/link-building pitches, unrelated B2B solicitations, crypto/scams, or generic mass outreach."
      : "Mark isSpam true when the message is clearly spam, advertising, SEO/link-building pitches, unrelated B2B solicitations, crypto/scams, or generic mass outreach — not a genuine local prospect.",
    "Do NOT mark as spam: real questions about services, process reviews, scheduling, referrals, or vague but legitimate business inquiries — unless operator instructions explicitly say to flag them.",
    "When isSpam is true, reason must be one concise sentence (max ~20 words). When false, reason must be an empty string.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { object } = await generateObject({
      model: getDraftModel(),
      schema: buildSpamSchema(hasOperatorRules),
      system,
      prompt: [
        hasOperatorRules
          ? `Apply these operator spam-detection instructions:\n${operatorRules}`
          : null,
        `Business: ${input.businessName}`,
        `Contact: ${input.contactName}`,
        lastName ? `Contact last name: ${lastName}` : null,
        `Email: ${input.email}`,
        input.phone ? `Phone: ${input.phone}` : null,
        input.title ? `Title: ${input.title}` : null,
        input.source ? `Source: ${input.source}` : null,
        input.message ? `Inquiry message:\n${input.message}` : "Inquiry message: (none)",
        input.notes ? `Internal notes:\n${input.notes}` : null,
        hasOperatorRules
          ? "Classify this inquiry. Operator instructions take priority."
          : "Classify this inquiry.",
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
