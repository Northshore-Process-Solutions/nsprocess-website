import { generateObject } from "ai";
import { z } from "zod";

import { getDraftModel } from "@/lib/ai/openai";

const draftSchema = z.object({
  scopeSummary: z
    .string()
    .describe(
      "Structured plain-text scope: short intro, then numbered and/or bulleted lists for deliverables, outcomes, and boundaries. Use real newlines. No markdown headings.",
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
    .describe("2–6 concrete line items that match the scope summary."),
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
}): Promise<DraftProposalOutput> {
  const businessName = clean(input.businessName) ?? "the client";
  const contactName = clean(input.contactName);
  const title = clean(input.title) ?? "Service Proposal";
  const notes = clean(input.notes);
  const existingScope = clean(input.existingScope);

  const existingItems = (input.existingItems ?? [])
    .map((item) => ({
      description: clean(item.description),
      quantity: clean(item.quantity) ?? "1",
      unitPrice: clean(item.unitPrice) ?? "",
    }))
    .filter((item) => item.description);

  const system = `You draft proposal content for ${input.operatorName}, a ${input.industry} business.

Voice: calm, practical, plain English. No hype, no emojis.
Return:
1) scopeSummary — structured plain text (not one dense paragraph), in language that fits ${input.industry}.
2) items — 2–6 billable line items that break the scope into concrete deliverables/phases the client will recognize.

scopeSummary formatting (required):
- Start with 1–2 short sentences on the overall engagement.
- Then use clear sections with short labels ending in a colon, for example:
  What we will do:
  1. ...
  2. ...
  Expected outcomes:
  - ...
  - ...
  Out of scope / boundaries:
  - ...
- Prefer numbered lists for sequenced work steps and bullets (-) for outcomes or boundaries.
- Use real newline characters between lines and sections. Keep the whole scope scannable (roughly 120–220 words).
- Do NOT use markdown headings (#), bold (**), or code fences. Plain text only.

Line item rules:
- Descriptions must be specific and client-facing (not internal jargon).
- Quantity is usually 1 unless notes imply otherwise.
- unitPrice should be a reasonable round USD starting point for this industry when you can infer one; use 0 when notes give no pricing signal and you cannot infer a typical amount.
- Line items must align with the scope summary (no orphan lines).
- Do not invent timelines, legal terms, or client-specific facts that were not provided.
- Do not include a greeting or sign-off.
${input.extraSystemRules ? `\n${input.extraSystemRules}` : ""}`;

  try {
    const { object } = await generateObject({
      model: getDraftModel(),
      schema: draftSchema,
      system,
      prompt: [
        `Proposal title: ${title}`,
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
        "Draft the scope summary and matching line items now.",
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
