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
