import { contact } from "@/lib/site-data";
import type { DemoBusiness } from "@/lib/demo/types";

/** Company shown as the issuer on printable billing documents. */
export type DocumentIssuer = {
  name: string;
  tagline: string | null;
  serviceArea: string | null;
  phone: string | null;
  email: string | null;
  logoSrc: string | null;
  logoAlt: string | null;
};

export const nspsDocumentIssuer: DocumentIssuer = {
  name: "North Shore Process Solutions",
  tagline: "Helping small businesses get their time back.",
  serviceArea: contact.serviceArea,
  phone: contact.phone,
  email: contact.email,
  logoSrc: "/transparentLogo.png",
  logoAlt: "North Shore Process Solutions",
};

export function documentIssuerFromDemoBusiness(
  business: DemoBusiness,
): DocumentIssuer {
  const category = business.category?.trim() || null;
  return {
    name: business.name.trim() || "Your business",
    tagline: category,
    serviceArea: business.location?.trim() || null,
    phone: business.phone?.trim() || null,
    email: business.email?.trim() || null,
    logoSrc: null,
    logoAlt: null,
  };
}

export function issuerContactLine(issuer: DocumentIssuer) {
  return [issuer.phone, issuer.email].filter(Boolean).join(" · ");
}

export function issuerFooterLine(issuer: DocumentIssuer) {
  return [issuer.name, issuer.email, issuer.phone].filter(Boolean).join(" · ");
}
