"use server";

import { generateText } from "ai";

import { getDraftModel } from "@/lib/ai/openai";
import { requireReadyDemoSession } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

export type AiActionResult = {
  ok: boolean;
  text?: string;
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
}): Promise<AiActionResult> {
  const auth = await requireCrmUserOrDemo();
  if (auth.error) return { ok: false, error: auth.error };

  const businessName = clean(input.businessName) ?? "the client";
  const contactName = clean(input.contactName);
  const title = clean(input.title) ?? "Service Proposal";
  const notes = clean(input.notes);
  const existingScope = clean(input.existingScope);

  const demoCompany = auth.demoSeed?.business;
  const industry =
    demoCompany?.category?.trim() ||
    demoCompany?.notes?.trim() ||
    "local service business";
  const operatorName = demoCompany?.name?.trim() || "the service company";

  const system = auth.demoSeed
    ? `You write concise proposal scope summaries for ${operatorName}, a ${industry} business.

Voice: calm, practical, plain English. No hype, no emojis, no markdown headings.
Output: 1 short paragraph (80–140 words) describing what the job/engagement will do, expected outcomes, and clear boundaries — in language that fits ${industry}.
Do not invent prices, timelines, or legal terms.
Do not invent client-specific facts that were not provided.
Do not include a greeting or sign-off.
Do not write as if you are North Shore Process Solutions unless that is the demo company.`
    : `You write concise proposal scope summaries for North Shore Process Solutions, a local business-efficiency consultancy on the Massachusetts North Shore.

Voice: calm, practical, plain English. No hype, no emojis, no markdown headings.
Output: 1 short paragraph (80–140 words) describing what the engagement will do, expected outcomes, and clear boundaries.
Do not invent prices, timelines, or legal terms.
Do not invent client-specific facts that were not provided.
Do not include a greeting or sign-off.`;

  try {
    const { text } = await generateText({
      model: getDraftModel(),
      system,
      prompt: [
        `Proposal title: ${title}`,
        `Client business: ${businessName}`,
        contactName ? `Contact: ${contactName}` : null,
        notes ? `Consult / internal notes:\n${notes}` : null,
        existingScope
          ? `Existing scope draft to improve:\n${existingScope}`
          : null,
        !notes && !existingScope
          ? auth.demoSeed
            ? `No consult notes were provided. Draft a general ${industry} job/engagement scope suitable for this client type, kept intentionally non-specific.`
            : "No consult notes were provided. Draft a general process-improvement engagement scope suitable for a small local service business, kept intentionally non-specific."
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
