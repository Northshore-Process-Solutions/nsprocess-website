"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Today", key: "today" as const, match: (p: string) => p === "/admin" },
  {
    href: "/admin/pipeline",
    label: "Pipeline",
    key: "pipeline" as const,
    match: (p: string) => p.startsWith("/admin/pipeline"),
  },
  {
    href: "/admin/crm",
    label: "CRM",
    key: "crm" as const,
    match: (p: string) =>
      p.startsWith("/admin/crm") || p.startsWith("/admin/organizations"),
  },
  {
    href: "/admin/billing",
    label: "Billing",
    key: "billing" as const,
    match: (p: string) =>
      p.startsWith("/admin/billing") ||
      p.startsWith("/admin/proposals") ||
      p.startsWith("/admin/agreements") ||
      p.startsWith("/admin/invoices") ||
      p.startsWith("/admin/statements"),
  },
  {
    href: "/admin/projects",
    label: "Projects",
    key: "projects" as const,
    match: (p: string) => p.startsWith("/admin/projects"),
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    key: "calendar" as const,
    match: (p: string) => p.startsWith("/admin/calendar"),
  },
  {
    href: "/admin/purchases",
    label: "Purchases",
    key: "purchases" as const,
    match: (p: string) => p.startsWith("/admin/purchases"),
  },
  {
    href: "/admin/tools",
    label: "Stack",
    key: "stack" as const,
    match: (p: string) => p.startsWith("/admin/tools"),
  },
];

/** @deprecated Prefer pathname-based AdminNav with no current prop. */
export type AdminNavKey =
  | "today"
  | "crm"
  | "pipeline"
  | "billing"
  | "projects"
  | "stack"
  | "calendar"
  | "purchases";

export function AdminNav({ current }: { current?: AdminNavKey } = {}) {
  const pathname = usePathname() ?? "/admin";

  return (
    <nav aria-label="Admin sections" className="flex gap-0 overflow-x-auto">
      {links.map((link) => {
        const active = current
          ? current === link.key
          : link.match(pathname);

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
  );
}
