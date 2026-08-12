import { randomBytes } from "crypto";

import { getAppOrigin } from "@/lib/proposal-share";

export function createInvoiceShareToken() {
  return randomBytes(24).toString("base64url");
}

export function invoiceSharePath(token: string) {
  return `/i/${token}`;
}

export function invoiceShareUrl(token: string) {
  return `${getAppOrigin()}${invoiceSharePath(token)}`;
}
