import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([headerName, headerValue]) => {
          supabaseResponse.headers.set(headerName, headerValue);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  // Keep old /admin bookmarks working
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const redirectUrl = request.nextUrl.clone();
    if (pathname === "/admin/crm" || pathname.startsWith("/admin/crm/")) {
      redirectUrl.pathname = pathname.replace(/^\/admin\/crm/, "/crm/businesses");
    } else {
      redirectUrl.pathname = pathname.replace(/^\/admin/, "/crm");
    }
    return NextResponse.redirect(redirectUrl);
  }

  const isPortalRoute = pathname.startsWith("/crm");
  const isLoginRoute = pathname === "/crm/login";

  if (isPortalRoute && !isLoginRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/crm/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/crm";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
