import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "CRM", key: "crm" as const },
  { href: "/admin/pipeline", label: "Pipeline", key: "pipeline" as const },
  { href: "/admin/proposals", label: "Proposals", key: "proposals" as const },
  { href: "/admin/projects", label: "Projects", key: "projects" as const },
  { href: "/admin/calendar", label: "Calendar", key: "calendar" as const },
  { href: "/admin/purchases", label: "Purchases", key: "purchases" as const },
  { href: "/admin/tools", label: "Stack", key: "stack" as const },
];

export function AdminNav({
  current,
}: {
  current:
    | "crm"
    | "pipeline"
    | "proposals"
    | "projects"
    | "stack"
    | "calendar"
    | "purchases";
}) {
  return (
    <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const active = current === link.key;

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
