import { generateObject } from "ai";
import { z } from "zod";

import { getDraftModel } from "@/lib/ai/openai";

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "yandex.com",
  "zoho.com",
]);

export type LeadResearchSource = {
  url: string;
  title?: string | null;
};

export type LeadResearchInput = {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
};

export type LeadResearchResult = {
  summary: string | null;
  sources: LeadResearchSource[];
};

const researchSchema = z.object({
  summary: z
    .string()
    .describe(
      "2–4 short sentences: what the business appears to do, location/market if clear, and legitimacy signals or red flags. Empty string if nothing useful.",
    ),
});

export function extractEmailDomain(email: string) {
  const at = email.trim().toLowerCase().lastIndexOf("@");
  if (at < 0) return null;
  const domain = email
    .trim()
    .toLowerCase()
    .slice(at + 1)
    .replace(/\.+$/, "");
  if (!domain || !domain.includes(".")) return null;
  return domain;
}

export function isFreeEmailDomain(domain: string) {
  return FREE_EMAIL_DOMAINS.has(domain.trim().toLowerCase());
}

export function guessWebsiteUrl(domain: string) {
  return `https://${domain.trim().toLowerCase()}`;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWebsiteText(
  url: string,
  options?: { timeoutMs?: number; maxChars?: number },
): Promise<{ url: string; title: string | null; text: string } | null> {
  const timeoutMs = options?.timeoutMs ?? 7000;
  const maxChars = options?.maxChars ?? 10_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "NSProcessLeadResearch/1.0 (+https://nsprocess.com; CRM lead research)",
      },
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return null;
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]
      ? stripHtml(titleMatch[1]).slice(0, 200) || null
      : null;
    const text = stripHtml(html).slice(0, maxChars);
    if (text.length < 40) return null;

    return { url: response.url || url, title, text };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function collectWebsitePages(domain: string) {
  const base = guessWebsiteUrl(domain);
  const homepage = await fetchWebsiteText(base);
  const pages: Array<{ url: string; title: string | null; text: string }> = [];
  if (homepage) pages.push(homepage);

  const aboutUrl = `${base.replace(/\/$/, "")}/about`;
  if (!homepage || !/about/i.test(homepage.url)) {
    const about = await fetchWebsiteText(aboutUrl);
    if (about) pages.push(about);
  }

  return pages;
}

/** Best-effort public website research for a lead. Never throws. */
export async function researchLeadContext(
  input: LeadResearchInput,
): Promise<LeadResearchResult> {
  const domain = extractEmailDomain(input.email);
  if (!domain || isFreeEmailDomain(domain)) {
    return { summary: null, sources: [] };
  }

  const pages = await collectWebsitePages(domain);
  if (pages.length === 0) {
    return {
      summary: null,
      sources: [{ url: guessWebsiteUrl(domain), title: null }],
    };
  }

  const sources: LeadResearchSource[] = pages.map((page) => ({
    url: page.url,
    title: page.title,
  }));

  try {
    const { object } = await generateObject({
      model: getDraftModel(),
      schema: researchSchema,
      system: [
        "You research inbound CRM leads using only the provided public website text.",
        "Write a concise operator briefing (2–4 sentences). Note what the company appears to sell, geography if clear, and any legitimacy or spam/ad red flags.",
        "Do not invent facts that are not supported by the website text. If evidence is thin, say so briefly.",
        "If nothing useful can be said, return an empty summary string.",
      ].join("\n"),
      prompt: [
        `Business name on inquiry: ${input.businessName}`,
        `Contact: ${input.contactName}`,
        `Email: ${input.email}`,
        input.phone ? `Phone: ${input.phone}` : null,
        input.message ? `Inquiry message:\n${input.message}` : null,
        `Email domain / website: ${domain}`,
        ...pages.map(
          (page, index) =>
            `Website page ${index + 1} (${page.url})${page.title ? ` — ${page.title}` : ""}:\n${page.text}`,
        ),
        "Write the briefing now.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const summary = object.summary.trim() || null;
    return { summary, sources };
  } catch (error) {
    console.error("researchLeadContext failed", error);
    return { summary: null, sources };
  }
}
