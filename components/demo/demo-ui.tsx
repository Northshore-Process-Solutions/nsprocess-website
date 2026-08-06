import Link from "next/link";

import { cn } from "@/lib/utils";

export function DemoPageHeader({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-5">
      {backHref ? (
        <Link
          className="mb-2 inline-block text-xs font-medium text-slate-500 hover:text-slate-900"
          href={backHref}
        >
          ← {backLabel ?? "Back"}
        </Link>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
    </header>
  );
}

export function DemoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function DemoCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-slate-200 bg-white p-4",
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function DemoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}
