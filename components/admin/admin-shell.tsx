"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { endDemoSession } from "@/app/demo/actions";
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
  // Demo intake lives at /demo/start (and legacy /demo when no session).
  if (pathname === "/demo/start") return true;
  return false;
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
  const portal = usePortal();
  const mode = portal.mode || portalModeFromPathname(pathname);
  const homeHref = portal.href();
  const isDemo = mode === "demo";

  if (isBarePortalRoute(pathname, mode)) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell min-h-screen bg-[#f1f3f5] text-foreground">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-12 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            aria-label="NSPS Portal home"
            className="inline-flex min-w-0 items-center gap-2.5 text-slate-900"
            href={homeHref}
          >
            <Image
              alt=""
              className="h-8 w-auto object-contain"
              height={32}
              priority
              src="/transparentLogo.png"
              width={44}
            />
            <span className="hidden min-w-0 sm:block">
              <span className="block text-sm font-semibold tracking-tight">
                NSPS Portal
              </span>
              {isDemo || subtitle ? (
                <span className="block truncate text-[11px] font-medium text-slate-500">
                  {subtitle ?? "Demo"}
                </span>
              ) : null}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {headerActions}
            {isDemo ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href="/contact">Book a real review</Link>
                </Button>
                <form action={endDemoSession}>
                  <Button size="sm" type="submit" variant="outline">
                    End demo
                  </Button>
                </form>
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
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      {isDemo ? (
        <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
          Demo sandbox — same portal UI as production; session-private data
          only.
        </footer>
      ) : null}
    </div>
  );
}
