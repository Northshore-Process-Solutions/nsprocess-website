import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type SettingsNavItem = {
  href: string;
  title: string;
  description: string;
  meta?: string | null;
};

export type SettingsNavGroup = {
  label?: string;
  items: SettingsNavItem[];
};

export function SettingsNavList({
  groups,
  className,
}: {
  groups: SettingsNavGroup[];
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl space-y-6", className)}>
      {groups.map((group) => (
        <section key={group.label ?? group.items[0]?.href}>
          {group.label ? (
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </h2>
          ) : null}
          <ul className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {group.items.map((item, index) => (
              <li key={item.href}>
                <Link
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50",
                    index > 0 && "border-t border-slate-100",
                  )}
                  href={item.href}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {item.description}
                    </p>
                    {item.meta ? (
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.meta}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-slate-400"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function SettingsDetailShell({
  backHref,
  backLabel,
  title,
  description,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div>
        <Link
          className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
          href={backHref}
        >
          ← {backLabel}
        </Link>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
