import { contact } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { DocumentIssuer } from "@/lib/document-issuer";

export type AppBrand = {
  companyName: string;
  portalName: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  serviceArea: string | null;
  /** Absolute URL or site-relative path for the logo. */
  logoUrl: string | null;
  /** Storage object path inside the branding bucket, if any. */
  logoPath: string | null;
};

export type AppSettingsRow = {
  company_name: string;
  portal_name: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  service_area: string | null;
  logo_path: string | null;
};

/** NSPS defaults for the marketing product install (when CRM_ONLY is off). */
export function nspsAppBrand(): AppBrand {
  return {
    companyName: "North Shore Process Solutions",
    portalName: "NSPS Portal",
    tagline: "Helping small businesses get their time back.",
    phone: contact.phone,
    email: contact.email,
    serviceArea: contact.serviceArea,
    logoUrl: "/transparentLogo.png",
    logoPath: null,
  };
}

/** Neutral defaults for white-label CRM installs until settings are saved. */
export function crmOnlyBootstrapBrand(): AppBrand {
  return {
    companyName:
      process.env.COMPANY_NAME?.trim() || "Your Company",
    portalName: process.env.PORTAL_NAME?.trim() || "CRM",
    tagline: process.env.COMPANY_TAGLINE?.trim() || null,
    phone: process.env.COMPANY_PHONE?.trim() || null,
    email: process.env.COMPANY_EMAIL?.trim() || null,
    serviceArea: process.env.COMPANY_SERVICE_AREA?.trim() || null,
    logoUrl: process.env.COMPANY_LOGO_URL?.trim() || null,
    logoPath: null,
  };
}

function isCrmOnly() {
  return process.env.CRM_ONLY === "1" || process.env.CRM_ONLY === "true";
}

export function fallbackAppBrand(): AppBrand {
  return isCrmOnly() ? crmOnlyBootstrapBrand() : nspsAppBrand();
}

export function brandingPublicUrl(logoPath: string | null | undefined) {
  if (!logoPath?.trim()) return null;
  const path = logoPath.trim().replace(/^\//, "");
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  try {
    const { url } = getSupabaseEnv();
    return `${url.replace(/\/$/, "")}/storage/v1/object/public/branding/${path}`;
  } catch {
    return null;
  }
}

export function appBrandFromRow(row: AppSettingsRow): AppBrand {
  return {
    companyName: row.company_name.trim(),
    portalName: row.portal_name.trim() || row.company_name.trim(),
    tagline: row.tagline?.trim() || null,
    phone: row.phone?.trim() || null,
    email: row.email?.trim() || null,
    serviceArea: row.service_area?.trim() || null,
    logoPath: row.logo_path?.trim() || null,
    logoUrl: brandingPublicUrl(row.logo_path) ?? null,
  };
}

export function documentIssuerFromBrand(brand: AppBrand): DocumentIssuer {
  return {
    name: brand.companyName,
    tagline: brand.tagline,
    serviceArea: brand.serviceArea,
    phone: brand.phone,
    email: brand.email,
    logoSrc: brand.logoUrl,
    logoAlt: brand.companyName,
  };
}

/** Resolve brand: saved CRM settings → env/bootstrap defaults. */
export async function getAppBrand(): Promise<AppBrand> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select(
        "company_name, portal_name, tagline, phone, email, service_area, logo_path",
      )
      .eq("id", true)
      .maybeSingle();

    if (!error && data) {
      return appBrandFromRow(data as AppSettingsRow);
    }
  } catch {
    // Fall through — e.g. missing table on a fresh DB, or no session for public pages.
  }

  // Public share pages / emails may need brand without a user session.
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/admin");
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("app_settings")
      .select(
        "company_name, portal_name, tagline, phone, email, service_area, logo_path",
      )
      .eq("id", true)
      .maybeSingle();

    if (!error && data) {
      return appBrandFromRow(data as AppSettingsRow);
    }
  } catch {
    // No service role or table yet.
  }

  return fallbackAppBrand();
}

export async function getLiveDocumentIssuer(): Promise<DocumentIssuer> {
  return documentIssuerFromBrand(await getAppBrand());
}
