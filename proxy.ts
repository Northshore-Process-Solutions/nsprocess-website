import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function isCrmOnly() {
  return process.env.CRM_ONLY === "1" || process.env.CRM_ONLY === "true";
}

/** Paths that stay available on customer CRM installs (no marketing site). */
function isAllowedOnCrmOnly(pathname: string) {
  if (pathname === "/crm" || pathname.startsWith("/crm/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  // Client proposal / agreement / invoice pay share links
  if (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/a/") ||
    pathname.startsWith("/i/")
  ) {
    return true;
  }
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCrmOnly() && !isAllowedOnCrmOnly(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/crm";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Auth / admin→crm rewrites only needed on portal routes
  if (
    pathname === "/crm" ||
    pathname.startsWith("/crm/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all app routes except Next internals and common static files.
     * CRM_ONLY installs redirect marketing pages to /crm.
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
