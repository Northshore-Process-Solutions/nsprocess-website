import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      aria-label="North Shore Process Solutions home"
      className={cn(
        "group inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      href="/"
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft transition-transform duration-200 group-hover:-translate-y-0.5">
        <span className="text-sm font-bold tracking-tight">NS</span>
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight text-foreground">
          North Shore
        </span>
        <span className="block text-xs font-medium text-muted-foreground">
          Process Solutions
        </span>
      </span>
    </Link>
  );
}
