import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/crm/billing", label: "Overview", key: "overview" as const },
  { href: "/crm/proposals", label: "Proposals", key: "proposals" as const },
  {
    href: "/crm/agreements",
    label: "Agreements",
    key: "agreements" as const,
  },
  { href: "/crm/invoices", label: "Invoices", key: "invoices" as const },
  {
    href: "/crm/statements",
    label: "Statements",
    key: "statements" as const,
  },
];

export type BillingSubnavKey =
  | "overview"
  | "proposals"
  | "agreements"
  | "invoices"
  | "statements";

export function BillingSubnav({ current }: { current: BillingSubnavKey }) {
  return (
    <nav
      aria-label="Billing sections"
      className="mt-3 flex flex-wrap gap-x-1 gap-y-0 border-b border-slate-200"
    >
      {links.map((link) => {
        const active = current === link.key;
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
