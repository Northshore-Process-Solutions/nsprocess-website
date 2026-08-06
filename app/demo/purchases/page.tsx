import Link from "next/link";
import { Receipt, WalletCards } from "lucide-react";

import { PurchasesPanel } from "@/components/admin/purchases-panel";
import { loadDemoCrmData } from "@/lib/demo/data";
import { portalPath } from "@/lib/portal/paths";
import {
  formatPurchaseAmount,
  PURCHASE_TYPES,
  type PurchaseType,
} from "@/lib/purchases";

export const metadata = {
  title: "Demo Purchases",
  robots: { index: false, follow: false },
};

type DemoPurchasesPageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

export default async function DemoPurchasesPage({
  searchParams,
}: DemoPurchasesPageProps) {
  const params = await searchParams;
  const typeFilter = (params?.type ?? "all") as PurchaseType | "all";
  const data = await loadDemoCrmData();
  const base = portalPath("demo");

  const purchases = data.purchases;
  const rows =
    typeFilter === "all"
      ? purchases
      : purchases.filter((row) => row.purchase_type === typeFilter);

  const totalSpend = purchases.reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const projectSpend = purchases
    .filter((row) => row.project_id)
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  const businesses = data.organizations.map((org) => ({
    id: org.id,
    name: org.name,
  }));

  const projects = data.projects.map((project) => ({
    id: project.id,
    name: project.name,
    organization_id: project.organization_id,
  }));

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Purchases
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Promo materials, equipment, and project-specific spend — not full
          inventory.
        </p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <WalletCards aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Total spend</p>
              <p className="text-2xl font-bold">
                {formatPurchaseAmount(totalSpend)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Receipt aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Project-linked</p>
              <p className="text-2xl font-bold">
                {formatPurchaseAmount(projectSpend)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Purchase type filters" className="mb-5 flex flex-wrap gap-2">
        <Link
          className={
            typeFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href={`${base}/purchases`}
        >
          All ({purchases.length})
        </Link>
        {PURCHASE_TYPES.map((type) => {
          const count = purchases.filter(
            (row) => row.purchase_type === type.value,
          ).length;
          const active = typeFilter === type.value;
          return (
            <Link
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`${base}/purchases?type=${type.value}`}
              key={type.value}
            >
              {type.label} ({count})
            </Link>
          );
        })}
      </nav>

      <PurchasesPanel
        businesses={businesses}
        projects={projects}
        readOnly
        rows={rows}
      />
    </main>
  );
}
