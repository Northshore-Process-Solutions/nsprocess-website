"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePortal } from "@/components/portal/portal-provider";
import { cn } from "@/lib/utils";

const linkDefs = [
  {
    path: "",
    label: "Home",
    key: "home" as const,
    match: (p: string, base: string) => p === base,
  },
  {
    path: "/pipeline",
    label: "Pipeline",
    key: "pipeline" as const,
    match: (p: string, base: string) => p.startsWith(`${base}/pipeline`),
  },
  {
    path: "/projects",
    label: "Projects",
    key: "projects" as const,
    match: (p: string, base: string) => p.startsWith(`${base}/projects`),
  },
  {
    path: "/calendar",
    label: "Calendar",
    key: "calendar" as const,
    match: (p: string, base: string) => p.startsWith(`${base}/calendar`),
  },
  {
    path: "/businesses",
    label: "Businesses",
    key: "crm" as const,
    match: (p: string, base: string) =>
      p.startsWith(`${base}/businesses`) ||
      p.startsWith(`${base}/organizations`),
  },
  {
    path: "/sales",
    label: "Sales",
    key: "sales" as const,
    match: (p: string, base: string) =>
      p.startsWith(`${base}/sales`) ||
      p.startsWith(`${base}/proposals`) ||
      p.startsWith(`${base}/agreements`),
  },
  {
    path: "/billing",
    label: "Billing",
    key: "billing" as const,
    match: (p: string, base: string) =>
      p.startsWith(`${base}/billing`) ||
      p.startsWith(`${base}/invoices`) ||
      p.startsWith(`${base}/statements`),
  },
  {
    path: "/purchases",
    label: "Purchases",
    key: "purchases" as const,
    match: (p: string, base: string) => p.startsWith(`${base}/purchases`),
  },
  {
    path: "/tools",
    label: "Stack",
    key: "stack" as const,
    match: (p: string, base: string) => p.startsWith(`${base}/tools`),
  },
  {
    path: "/settings",
    label: "Settings",
    key: "settings" as const,
    match: (p: string, base: string) => p.startsWith(`${base}/settings`),
  },
];

/** @deprecated Prefer pathname-based AdminNav with no current prop. */
export type AdminNavKey =
  | "home"
  | "crm"
  | "pipeline"
  | "sales"
  | "billing"
  | "projects"
  | "stack"
  | "calendar"
  | "purchases"
  | "settings";

export function AdminNav({ current }: { current?: AdminNavKey } = {}) {
  const pathname = usePathname() ?? "/crm";
  const { href, basePath, isDemo } = usePortal();
  const links = isDemo
    ? linkDefs.filter((link) => link.key !== "settings")
    : linkDefs;

  return (
    <div className="relative -mx-4 sm:mx-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent sm:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent sm:hidden"
      />
      <nav
        aria-label="Admin sections"
        className="flex gap-0 overflow-x-auto overscroll-x-contain px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {links.map((link) => {
          const linkHref = href(link.path);
          const active = current
            ? current === link.key
            : link.match(pathname, basePath);

          return (
            <Link
              className={cn(
                "shrink-0 snap-start border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
              )}
              href={linkHref}
              key={link.path || "home"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
