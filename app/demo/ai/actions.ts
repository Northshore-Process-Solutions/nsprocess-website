"use server";

import {
  generateProposalDraft,
  type DraftProposalLineItem,
} from "@/lib/ai/draft-proposal";
import { requireReadyDemoSession } from "@/lib/demo/session";

export type DemoAiActionResult = {
  ok: boolean;
  text?: string;
  items?: DraftProposalLineItem[];
  error?: string;
};

/** Draft proposal scope + line items for an active demo session (no CRM sign-in required). */
export async function draftDemoProposalScope(input: {
  businessName?: string;
  contactName?: string;
  title?: string;
  notes?: string;
  existingScope?: string;
  existingItems?: DraftProposalLineItem[];
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

  const demoCompany = session.seed.business;
  const industry =
    demoCompany?.category?.trim() ||
    demoCompany?.notes?.trim() ||
    "local service business";
  const operatorName = demoCompany?.name?.trim() || "the service company";

  const result = await generateProposalDraft({
    operatorName,
    industry,
    businessName: input.businessName,
    contactName: input.contactName,
    title: input.title,
    notes: input.notes,
    existingScope: input.existingScope,
    existingItems: input.existingItems,
    extraSystemRules:
      "Do not write as if you are North Shore Process Solutions unless that is the demo company.",
    emptyNotesFallback: `No consult notes were provided. Draft a general ${industry} job/engagement scope and matching line items suitable for this client type, kept intentionally non-specific.`,
    documentKind: "proposal",
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

/** Draft agreement scope + line items for an active demo session. */
export async function draftDemoAgreementScope(input: {
  businessName?: string;
  contactName?: string;
  title?: string;
  notes?: string;
  existingScope?: string;
  existingItems?: DraftProposalLineItem[];
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

  const demoCompany = session.seed.business;
  const industry =
    demoCompany?.category?.trim() ||
    demoCompany?.notes?.trim() ||
    "local service business";
  const operatorName = demoCompany?.name?.trim() || "the service company";

  const result = await generateProposalDraft({
    operatorName,
    industry,
    businessName: input.businessName,
    contactName: input.contactName,
    title: input.title,
    notes: input.notes,
    existingScope: input.existingScope,
    existingItems: input.existingItems,
    extraSystemRules:
      "Do not write as if you are North Shore Process Solutions unless that is the demo company.",
    emptyNotesFallback: `No consult notes were provided. Draft a general ${industry} agreement scope and matching line items suitable for this client type, kept intentionally non-specific.`,
    documentKind: "agreement",
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
