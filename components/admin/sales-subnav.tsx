"use client";

import Link from "next/link";

import { usePortal } from "@/components/portal/portal-provider";
import { cn } from "@/lib/utils";

const linkDefs = [
  { path: "/sales", label: "Overview", key: "overview" as const },
  { path: "/proposals", label: "Proposals", key: "proposals" as const },
  { path: "/agreements", label: "Agreements", key: "agreements" as const },
];

export type SalesSubnavKey = "overview" | "proposals" | "agreements";

export function SalesSubnav({ current }: { current: SalesSubnavKey }) {
  const { href } = usePortal();

  return (
    <nav
      aria-label="Sales sections"
      className="mt-3 flex flex-wrap gap-x-1 gap-y-0 border-b border-slate-200"
    >
      {linkDefs.map((link) => {
        const active = current === link.key;
        return (
          <Link
            className={cn(
              "border-b-2 px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
            href={href(link.path)}
            key={link.key}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
