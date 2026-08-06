import Link from "next/link";
import { FileText, PenLine } from "lucide-react";

import { AgreementsPanel } from "@/components/admin/agreements-panel";
import { BillingSubnav } from "@/components/admin/billing-subnav";
import { loadDemoCrmData } from "@/lib/demo/data";
import { portalPath } from "@/lib/portal/paths";
import { AGREEMENT_STATUSES, type AgreementStatus } from "@/lib/agreements";
import { formatMoney } from "@/lib/billing";

export const metadata = {
  title: "Demo Agreements",
  robots: { index: false, follow: false },
};

type DemoAgreementsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function DemoAgreementsPage({
  searchParams,
}: DemoAgreementsPageProps) {
  const params = await searchParams;
  const statusFilter = (params?.status ?? "all") as AgreementStatus | "all";
  const data = await loadDemoCrmData();
  const base = portalPath("demo");

  const agreements = data.agreements.map((row) => ({
    ...row,
    agreement_items: [],
  }));

  const rows =
    statusFilter === "all"
      ? agreements
      : agreements.filter((row) => row.status === statusFilter);

  const draftCount = agreements.filter((row) => row.status === "draft").length;
  const signedCount = agreements.filter((row) => row.status === "signed").length;
  const openValue = agreements
    .filter((row) => row.status === "draft" || row.status === "sent")
    .reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Agreements
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Turn accepted proposals into signed agreements and print PDFs for
          clients.
        </p>
        <BillingSubnav current="agreements" />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <FileText aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <PenLine aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Signed</p>
              <p className="text-2xl font-bold">{signedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div>
            <p className="text-sm text-muted-foreground">Open value</p>
            <p className="text-2xl font-bold">{formatMoney(openValue)}</p>
          </div>
        </div>
      </section>

      <nav
        aria-label="Agreement status filters"
        className="mb-5 flex flex-wrap gap-2"
      >
        <Link
          className={
            statusFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href={`${base}/agreements`}
        >
          All ({agreements.length})
        </Link>
        {AGREEMENT_STATUSES.map((status) => {
          const count = agreements.filter(
            (row) => row.status === status.value,
          ).length;
          const active = statusFilter === status.value;
          return (
            <Link
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`${base}/agreements?status=${status.value}`}
              key={status.value}
            >
              {status.label} ({count})
            </Link>
          );
        })}
      </nav>

      <AgreementsPanel readOnly rows={rows} />
    </main>
  );
}
