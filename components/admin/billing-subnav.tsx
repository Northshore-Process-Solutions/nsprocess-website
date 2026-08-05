import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/billing", label: "Overview", key: "overview" as const },
  { href: "/admin/proposals", label: "Proposals", key: "proposals" as const },
  {
    href: "/admin/agreements",
    label: "Agreements",
    key: "agreements" as const,
  },
  { href: "/admin/invoices", label: "Invoices", key: "invoices" as const },
  {
    href: "/admin/statements",
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
      className="mt-4 flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {links.map((link) => {
        const active = current === link.key;
        return (
          <Link
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
