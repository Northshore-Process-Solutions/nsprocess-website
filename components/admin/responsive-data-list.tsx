import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Desktop table + mobile stacked cards. Shared by CRM/demo list views. */
export function ResponsiveDataList({
  cards,
  table,
}: {
  cards: ReactNode;
  table: ReactNode;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">{cards}</div>
      <div className="hidden md:block">{table}</div>
    </>
  );
}

export function MobileDataCard({
  title,
  subtitle,
  badge,
  meta,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold leading-snug text-foreground">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {meta ? (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {meta}
        </div>
      ) : null}
      {children ? <div className="mt-3 space-y-2 text-sm">{children}</div> : null}
      {actions ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          {actions}
        </div>
      ) : null}
    </article>
  );
}

export function MobileDataField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">
        {children}
      </span>
    </div>
  );
}
