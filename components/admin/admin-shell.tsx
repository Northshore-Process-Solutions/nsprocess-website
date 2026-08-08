"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { markDemoSkipEnd } from "@/components/demo/demo-session-flags";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import { portalModeFromPathname } from "@/lib/portal/paths";

function isBarePortalRoute(pathname: string, mode: "live" | "demo") {
  if (mode === "live") {
    if (pathname === "/crm/login") return true;
    if (pathname.includes("/pdf")) return true;
    if (pathname.startsWith("/crm/statements/view")) return true;
    return false;
  }
  if (pathname === "/demo/start") return true;
  if (pathname.includes("/pdf")) return true;
  if (pathname.startsWith("/demo/statements/view")) return true;
  return false;
}

async function endDemoViaApi() {
  await fetch("/api/demo/end", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    cache: "no-store",
  });
}

export function AdminShell({
  children,
  subtitle,
  headerActions,
}: {
  children: React.ReactNode;
  subtitle?: string;
  headerActions?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/crm";
  const [leaving, setLeaving] = useState(false);
  const portal = usePortal();
  const mode = portal.mode || portalModeFromPathname(pathname);
  const homeHref = portal.href();
  const isDemo = mode === "demo";

  async function leaveDemo(href: string) {
    setLeaving(true);
    try {
      await endDemoViaApi();
    } catch {
      // Still leave even if cleanup fails.
    }
    // Hard navigation avoids App Router / CDN serving a cached demo page.
    window.location.assign(href);
  }

  async function handleEndDemo() {
    setLeaving(true);
    try {
      await endDemoViaApi();
    } catch {
      // Still leave.
    }
    markDemoSkipEnd();
    window.location.assign("/demo/start");
  }

  if (isBarePortalRoute(pathname, mode)) {
    return <>{children}</>;
  }

  const brand = portal.brand;
  const portalName = brand?.portalName ?? (isDemo ? "Demo Portal" : "CRM");
  const logoSrc = brand?.logoUrl ?? null;

  return (
    <div className="admin-shell min-h-screen bg-[#f1f3f5] text-foreground">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="flex h-12 w-full items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <Link
            aria-label={`${portalName} home`}
            className="inline-flex min-w-0 items-center gap-2.5 text-slate-900"
            href={homeHref}
          >
            {logoSrc ? (
              // Brand logos may be remote Supabase URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-8 w-auto max-w-[6.5rem] object-contain sm:max-w-[7rem]"
                height={32}
                src={logoSrc}
                width={44}
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-xs font-bold text-white">
                {(brand?.companyName ?? portalName).slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight">
                {portalName}
              </span>
              {isDemo || subtitle ? (
                <span className="hidden truncate text-[11px] font-medium text-slate-500 sm:block">
                  {subtitle ?? "Demo"}
                </span>
              ) : brand?.companyName &&
                brand.companyName !== portalName ? (
                <span className="hidden truncate text-[11px] font-medium text-slate-500 sm:block">
                  {brand.companyName}
                </span>
              ) : null}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            {isDemo ? (
              <>
                <Button
                  className="hidden sm:inline-flex"
                  disabled={leaving}
                  onClick={() => void leaveDemo("/contact")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Book a real review
                </Button>
                <Button
                  disabled={leaving}
                  onClick={() => void handleEndDemo()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {leaving ? "Ending…" : "End demo"}
                </Button>
              </>
            ) : (
              <SignOutButton />
            )}
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 sm:px-6">
          <AdminNav />
        </div>
      </header>
      <div className="min-w-0 w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        {children}
      </div>
      {isDemo ? (
        <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
          Demo sandbox — same portal UI as production; session-private data
          only.
        </footer>
      ) : null}
    </div>
  );
}
