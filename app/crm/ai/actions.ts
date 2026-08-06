"use server";

import { generateText } from "ai";

import { getDraftModel } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";

export type AiActionResult = {
  ok: boolean;
  text?: string;
  error?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "You must be signed in." as const };
  }

  return { error: null };
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
}): Promise<AiActionResult> {
  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const businessName = clean(input.businessName) ?? "the client";
  const contactName = clean(input.contactName);
  const title = clean(input.title) ?? "Process Improvement Proposal";
  const notes = clean(input.notes);
  const existingScope = clean(input.existingScope);

  try {
    const { text } = await generateText({
      model: getDraftModel(),
      system: `You write concise proposal scope summaries for North Shore Process Solutions, a local business-efficiency consultancy on the Massachusetts North Shore.

Voice: calm, practical, plain English. No hype, no emojis, no markdown headings.
Output: 1 short paragraph (80–140 words) describing what the engagement will do, expected outcomes, and clear boundaries.
Do not invent prices, timelines, or legal terms.
Do not invent client-specific facts that were not provided.
Do not include a greeting or sign-off.`,
      prompt: [
        `Proposal title: ${title}`,
        `Client business: ${businessName}`,
        contactName ? `Contact: ${contactName}` : null,
        notes ? `Consult / internal notes:\n${notes}` : null,
        existingScope
          ? `Existing scope draft to improve:\n${existingScope}`
          : null,
        !notes && !existingScope
          ? "No consult notes were provided. Draft a general process-improvement engagement scope suitable for a small local service business, kept intentionally non-specific."
          : null,
        "Write the scope summary now.",
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
      error instanceof Error ? error.message : "Failed to draft with AI.";
    return { ok: false, error: message };
  }
}
