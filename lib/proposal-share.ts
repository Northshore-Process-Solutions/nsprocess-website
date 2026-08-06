import { randomBytes } from "crypto";

export function createProposalShareToken() {
  return randomBytes(24).toString("base64url");
}

export function proposalSharePath(token: string) {
  return `/p/${token}`;
}

/** Absolute origin for share links in emails. Browser copy uses window.location.origin. */
export function getAppOrigin() {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(
      /\/$/,
      "",
    )}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "https://nsprocess.com";
}

export function proposalShareUrl(token: string) {
  return `${getAppOrigin()}${proposalSharePath(token)}`;
}
