"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";

function isBareAdminRoute(pathname: string) {
  if (pathname === "/admin/login") return true;
  if (pathname.includes("/pdf")) return true;
  if (pathname.startsWith("/admin/statements/view")) return true;
  return false;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";

  if (isBareAdminRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell min-h-screen bg-[#f1f3f5] text-foreground">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-12 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            aria-label="NSPS Admin home"
            className="inline-flex items-center gap-2.5 text-slate-900"
            href="/admin"
          >
            <Image
              alt=""
              className="h-8 w-auto object-contain"
              height={32}
              priority
              src="/transparentLogo.png"
              width={44}
            />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              NSPS Admin
            </span>
          </Link>
          <SignOutButton />
        </div>
        <div className="border-t border-slate-100 px-4 sm:px-6">
          <AdminNav />
        </div>
      </header>
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
