"use server";

import { generateText } from "ai";

import { getDraftModel } from "@/lib/ai/openai";
import { requireReadyDemoSession } from "@/lib/demo/session";

export type DemoAiActionResult = {
  ok: boolean;
  text?: string;
  error?: string;
};

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Draft proposal scope for an active demo session (no CRM sign-in required). */
export async function draftDemoProposalScope(input: {
  businessName?: string;
  contactName?: string;
  title?: string;
  notes?: string;
  existingScope?: string;
}): Promise<DemoAiActionResult> {
  const { session, error } = await requireReadyDemoSession();
  if (!session?.seed) {
    return {
      ok: false,
      error:
        error === "Demo session expired."
          ? "Your demo session expired. Start a new demo to continue."
          : error === "No demo session."
            ? "Start a demo session to draft with AI."
            : "Demo session is not ready. Return to the demo home and try again.",
    };
  }

  const businessName = clean(input.businessName) ?? "the client";
  const contactName = clean(input.contactName);
  const title = clean(input.title) ?? "Service Proposal";
  const notes = clean(input.notes);
  const existingScope = clean(input.existingScope);

  const demoCompany = session.seed.business;
  const industry =
    demoCompany?.category?.trim() ||
    demoCompany?.notes?.trim() ||
    "local service business";
  const operatorName = demoCompany?.name?.trim() || "the service company";

  try {
    const { text } = await generateText({
      model: getDraftModel(),
      system: `You write concise proposal scope summaries for ${operatorName}, a ${industry} business.

Voice: calm, practical, plain English. No hype, no emojis, no markdown headings.
Output: 1 short paragraph (80–140 words) describing what the job/engagement will do, expected outcomes, and clear boundaries — in language that fits ${industry}.
Do not invent prices, timelines, or legal terms.
Do not invent client-specific facts that were not provided.
Do not include a greeting or sign-off.
Do not write as if you are North Shore Process Solutions unless that is the demo company.`,
      prompt: [
        `Proposal title: ${title}`,
        `Client business: ${businessName}`,
        contactName ? `Contact: ${contactName}` : null,
        notes ? `Consult / internal notes:\n${notes}` : null,
        existingScope
          ? `Existing scope draft to improve:\n${existingScope}`
          : null,
        !notes && !existingScope
          ? `No consult notes were provided. Draft a general ${industry} job/engagement scope suitable for this client type, kept intentionally non-specific.`
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
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Failed to draft with AI.";
    return { ok: false, error: message };
  }
}
