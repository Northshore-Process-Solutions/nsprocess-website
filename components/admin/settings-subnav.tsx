"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const linkDefs = [
  {
    href: "/crm/settings/company",
    label: "Company",
    match: (p: string) =>
      p === "/crm/settings/company" || p.startsWith("/crm/settings/company/"),
  },
  {
    href: "/crm/settings/site",
    label: "Site",
    match: (p: string) =>
      p === "/crm/settings/site" || p.startsWith("/crm/settings/site/"),
  },
];

export function SettingsSubnav() {
  const pathname = usePathname() ?? "/crm/settings";

  return (
    <nav
      aria-label="Settings sections"
      className="mt-3 flex flex-wrap gap-x-1 gap-y-0 border-b border-slate-200"
    >
      {linkDefs.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            className={cn(
              "border-b-2 px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800",
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
