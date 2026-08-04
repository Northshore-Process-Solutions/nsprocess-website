import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "CRM" },
  { href: "/admin/tools", label: "Stack" },
];

export function AdminNav({ current }: { current: "crm" | "stack" }) {
  return (
    <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          (current === "crm" && link.href === "/admin") ||
          (current === "stack" && link.href === "/admin/tools");

        return (
          <Link
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
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
