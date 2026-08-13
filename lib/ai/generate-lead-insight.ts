import { generateObject } from "ai";
import { z } from "zod";

import { getDraftModel } from "@/lib/ai/openai";
import type { AppAiConfig } from "@/lib/app-ai";
import type { LeadInsight } from "@/lib/leads";
import type { LeadResearchSource } from "@/lib/leads/research-lead";

export type { LeadInsight };

export type LeadInsightInput = {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  source?: string | null;
  message?: string | null;
  notes?: string | null;
  researchSummary?: string | null;
  researchSources?: LeadResearchSource[] | null;
};

const insightSchema = z.object({
  companySnapshot: z
    .string()
    .describe(
      "2–3 sentences on who they appear to be and what they do. Use inquiry + research; say when evidence is thin.",
    ),
  fit: z
    .string()
    .describe(
      "1–2 sentences on how well this lead fits the operator's offer/industry. Be practical, not hype.",
    ),
  talkingPoints: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("2–4 short bullet talking points for the first call or email."),
  nextStep: z
    .string()
    .describe(
      "One concrete next action for the operator (e.g. call to qualify scope, send process-review invite).",
    ),
  risks: z
    .string()
    .describe(
      "Optional short note on risks (spammy signals, vague ask, bad fit). Empty string when none.",
    ),
});

export function parseLeadInsight(value: unknown): LeadInsight | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const companySnapshot =
    typeof row.companySnapshot === "string" ? row.companySnapshot.trim() : "";
  const fit = typeof row.fit === "string" ? row.fit.trim() : "";
  const nextStep = typeof row.nextStep === "string" ? row.nextStep.trim() : "";
  const talkingPoints = Array.isArray(row.talkingPoints)
    ? row.talkingPoints
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const risksRaw = typeof row.risks === "string" ? row.risks.trim() : "";
  if (!companySnapshot && !fit && !nextStep && talkingPoints.length === 0) {
    return null;
  }
  return {
    companySnapshot,
    fit,
    talkingPoints,
    nextStep,
    risks: risksRaw || null,
  };
}

export async function generateLeadInsight(
  input: LeadInsightInput,
  ai: Pick<AppAiConfig, "industry" | "operatorName">,
): Promise<LeadInsight | null> {
  try {
    const { object } = await generateObject({
      model: getDraftModel(),
      schema: insightSchema,
      system: [
        `You write concise CRM lead insights for ${ai.operatorName}, a ${ai.industry} business.`,
        "Audience: the operator deciding how to follow up — not the prospect.",
        "Be specific and practical. Do not invent customers, revenue, headcount, or facts not supported by the inquiry or research.",
        "If research is missing (e.g. free email domain), lean on the inquiry message and be explicit about uncertainty.",
        "Talking points should be usable on a first call. Next step must be one clear action.",
      ].join("\n"),
      prompt: [
        `Business: ${input.businessName}`,
        `Contact: ${input.contactName}`,
        `Email: ${input.email}`,
        input.phone ? `Phone: ${input.phone}` : null,
        input.title ? `Title: ${input.title}` : null,
        input.source ? `Source: ${input.source}` : null,
        input.message ? `Inquiry message:\n${input.message}` : "Inquiry message: (none)",
        input.notes ? `Internal notes:\n${input.notes}` : null,
        input.researchSummary
          ? `Background research:\n${input.researchSummary}`
          : "Background research: (none)",
        input.researchSources && input.researchSources.length > 0
          ? `Research sources:\n${input.researchSources
              .map((s) => `- ${s.url}${s.title ? ` (${s.title})` : ""}`)
              .join("\n")}`
          : null,
        "Generate the lead insight now.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const risks = object.risks.trim();
    return {
      companySnapshot: object.companySnapshot.trim(),
      fit: object.fit.trim(),
      talkingPoints: object.talkingPoints.map((p) => p.trim()).filter(Boolean),
      nextStep: object.nextStep.trim(),
      risks: risks || null,
    };
  } catch (error) {
    console.error("generateLeadInsight failed", error);
    return null;
  }
}
