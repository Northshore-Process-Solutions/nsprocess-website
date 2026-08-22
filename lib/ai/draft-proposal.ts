import { generateObject } from "ai";
import { z } from "zod";

import { getDraftModel } from "@/lib/ai/openai";

const draftSchema = z.object({
  scopeSummary: z
    .string()
    .describe(
      "Short high-level scope: 1–2 intro sentences, brief outcomes bullets, brief boundaries bullets. Do NOT list every billable deliverable — those belong in items. Plain text with real newlines; no markdown headings.",
    ),
  items: z
    .array(
      z.object({
        description: z
          .string()
          .describe("Clear billable line description the client will understand."),
        quantity: z
          .number()
          .positive()
          .describe("Quantity for this line (usually 1)."),
        unitPrice: z
          .number()
          .nonnegative()
          .describe(
            "Suggested USD unit price as an editable starting point. Use 0 if pricing is unknown.",
          ),
      }),
    )
    .min(2)
    .max(6)
    .describe(
      "2–6 concrete billable line items. These carry the detailed deliverables; do not repeat them verbatim in scopeSummary.",
    ),
});

export type DraftProposalLineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
};

export type DraftProposalOutput = {
  ok: true;
  scopeSummary: string;
  items: DraftProposalLineItem[];
} | {
  ok: false;
  error: string;
};

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function formatUnitPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export async function generateProposalDraft(input: {
  operatorName: string;
  industry: string;
  businessName?: string;
  contactName?: string;
  title?: string;
  notes?: string;
  existingScope?: string;
  existingItems?: Array<{
    description?: string;
    quantity?: string;
    unitPrice?: string;
  }>;
  /** Extra system constraints (e.g. do not write as NSPS). */
  extraSystemRules?: string;
  emptyNotesFallback: string;
  /** Defaults to proposal wording in prompts. */
  documentKind?: "proposal" | "agreement";
}): Promise<DraftProposalOutput> {
  const documentKind = input.documentKind ?? "proposal";
  const documentLabel = documentKind === "agreement" ? "Agreement" : "Proposal";
  const businessName = clean(input.businessName) ?? "the client";
  const contactName = clean(input.contactName);
  const title =
    clean(input.title) ??
    (documentKind === "agreement" ? "Service Agreement" : "Service Proposal");
  const notes = clean(input.notes);
  const existingScope = clean(input.existingScope);

  const existingItems = (input.existingItems ?? [])
    .map((item) => ({
      description: clean(item.description),
      quantity: clean(item.quantity) ?? "1",
      unitPrice: clean(item.unitPrice) ?? "",
    }))
    .filter((item) => item.description);

  const system = [
    input.extraSystemRules?.trim() || null,
    documentKind === "agreement"
      ? `You draft agreement (contract) content for ${input.operatorName}, a ${input.industry} business. Scope and line items must read as a clear binding work description suitable for client signature — precise deliverables, not marketing copy.`
      : `You draft proposal content for ${input.operatorName}, a ${input.industry} business.`,
    input.extraSystemRules?.trim()
      ? "Default voice only when operator instructions do not specify otherwise: calm, practical, plain English. No hype, no emojis."
      : "Voice: calm, practical, plain English. No hype, no emojis.",
    `Return two complementary parts — do not repeat the same detail in both:

1) scopeSummary — a SHORT high-level narrative (about 60–120 words), not a duplicate of the line items.
2) items — 2–6 billable line items that carry the concrete deliverables/phases.

Division of labor (required):
- scopeSummary = why / overall engagement / outcomes / boundaries.
- items = what is billed (specific deliverables).
- Never copy line-item wording into the scope as a numbered "What we will do" checklist.
- Never paste the full scope paragraph into a line item.

scopeSummary formatting:
- Start with 1–2 short sentences on the overall engagement.
- Then short sections with labels ending in a colon, for example:
  Expected outcomes:
  - ...
  - ...
  Out of scope / boundaries:
  - ...
- Prefer 2–4 outcome bullets and 2–3 boundary bullets. Keep it scannable.
- Use real newline characters. No markdown headings (#), bold (**), or code fences.

Line item rules:
- Descriptions must be specific and client-facing (not internal jargon).
- Quantity is usually 1 unless notes imply otherwise.
- unitPrice should be a reasonable round USD starting point for this industry when you can infer one; use 0 when notes give no pricing signal and you cannot infer a typical amount.
- Line items should support the scope story without restating the intro paragraph.
- Do not invent timelines, legal terms, or client-specific facts that were not provided.
- Do not include a greeting or sign-off.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { object } = await generateObject({
      model: getDraftModel(),
      schema: draftSchema,
      system,
      prompt: [
        `${documentLabel} title: ${title}`,
        `Client business: ${businessName}`,
        contactName ? `Contact: ${contactName}` : null,
        notes ? `Consult / internal notes:\n${notes}` : null,
        existingScope
          ? `Existing scope draft to improve:\n${existingScope}`
          : null,
        existingItems.length > 0
          ? `Existing line items to improve or replace:\n${JSON.stringify(existingItems, null, 2)}`
          : null,
        !notes && !existingScope && existingItems.length === 0
          ? input.emptyNotesFallback
          : null,
        `Draft a concise high-level ${documentKind} scope summary plus distinct billable line items. Do not repeat deliverables in both places.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const scopeSummary = object.scopeSummary.trim();
    const items = object.items
      .map((item) => ({
        description: item.description.trim(),
        quantity: String(item.quantity),
        unitPrice: formatUnitPrice(item.unitPrice),
      }))
      .filter((item) => item.description.length > 0);

    if (!scopeSummary) {
      return { ok: false, error: "AI returned an empty scope summary." };
    }
    if (items.length === 0) {
      return { ok: false, error: "AI returned no line items." };
    }

    return { ok: true, scopeSummary, items };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to draft with AI.";
    return { ok: false, error: message };
  }
}
