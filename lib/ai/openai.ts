import { openai } from "@ai-sdk/openai";

export function getOpenAIApiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to .env.local and Vercel env vars.",
    );
  }
  return key;
}

/** Default chat model for admin drafting features. */
export function getDraftModel() {
  getOpenAIApiKey();
  return openai("gpt-4.1-mini");
}

/**
 * Fast/cheap default for demo CRM seed generation.
 * Override with DEMO_SEED_MODEL if needed.
 */
export function getDemoSeedModel() {
  getOpenAIApiKey();
  return openai(process.env.DEMO_SEED_MODEL?.trim() || "gpt-5.6-luna");
}

/**
 * Stronger one-shot fallback when Luna fails schema/generation.
 * Override with DEMO_SEED_FALLBACK_MODEL if needed.
 */
export function getDemoSeedFallbackModel() {
  getOpenAIApiKey();
  return openai(process.env.DEMO_SEED_FALLBACK_MODEL?.trim() || "gpt-4.1");
}
