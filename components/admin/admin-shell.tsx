"use client";

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
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            className="text-sm font-semibold tracking-tight text-slate-900"
            href="/admin"
          >
            NSPS Admin
          </Link>
          <SignOutButton />
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <AdminNav />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
