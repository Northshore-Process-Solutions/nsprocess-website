import { randomBytes } from "crypto";

import { getAppOrigin } from "@/lib/proposal-share";

export function createAgreementShareToken() {
  return randomBytes(24).toString("base64url");
}

export function agreementSharePath(token: string) {
  return `/a/${token}`;
}

export function agreementShareUrl(token: string) {
  return `${getAppOrigin()}${agreementSharePath(token)}`;
}
