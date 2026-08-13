"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { endDemoSession } from "@/app/demo/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/demo/home",
    label: "Home",
    match: (p: string) => p === "/demo/home" || p === "/demo",
  },
  {
    href: "/demo/pipeline",
    label: "Pipeline",
    match: (p: string) => p.startsWith("/demo/pipeline"),
  },
  {
    href: "/demo/sales",
    label: "Sales",
    match: (p: string) =>
      p.startsWith("/demo/sales") ||
      p.startsWith("/demo/proposals") ||
      p.startsWith("/demo/agreements"),
  },
  {
    href: "/demo/projects",
    label: "Projects",
    match: (p: string) => p.startsWith("/demo/projects"),
  },
  {
    href: "/demo/calendar",
    label: "Calendar",
    match: (p: string) => p.startsWith("/demo/calendar"),
  },
  {
    href: "/demo/billing",
    label: "Billing",
    match: (p: string) =>
      p.startsWith("/demo/billing") ||
      p.startsWith("/demo/invoices") ||
      p.startsWith("/demo/statements"),
  },
  {
    href: "/demo/businesses",
    label: "Businesses",
    match: (p: string) => p.startsWith("/demo/businesses"),
  },
  {
    href: "/demo/purchases",
    label: "Purchases",
    match: (p: string) => p.startsWith("/demo/purchases"),
  },
  {
    href: "/demo/tools",
    label: "Stack",
    match: (p: string) => p.startsWith("/demo/tools"),
  },
];

export function DemoShell({
  children,
  businessName,
}: {
  children: React.ReactNode;
  businessName?: string;
}) {
  const pathname = usePathname() ?? "/demo/home";

  return (
    <div className="admin-shell min-h-screen bg-[#f1f3f5] text-foreground">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-12 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            aria-label="NSPS Portal demo home"
            className="inline-flex min-w-0 items-center gap-2.5 text-slate-900"
            href="/demo/home"
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
              <span className="block truncate text-[11px] font-medium text-slate-500">
                Demo{businessName ? ` · ${businessName}` : ""}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/contact">Book a real review</Link>
            </Button>
            <form action={endDemoSession}>
              <Button size="sm" type="submit" variant="outline">
                End demo
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 sm:px-6">
          <nav aria-label="Demo sections" className="flex gap-0 overflow-x-auto">
            {links.map((link) => {
              const active = link.match(pathname);
              return (
                <Link
                  className={cn(
                    "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
                  )}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
        Demo sandbox only. Same layout as the real portal — private to this
        browser session.
      </footer>
    </div>
  );
}
