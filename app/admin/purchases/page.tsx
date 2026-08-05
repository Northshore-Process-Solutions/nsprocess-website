import { redirect } from "next/navigation";
import { Receipt, WalletCards } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { PurchasesPanel } from "@/components/admin/purchases-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import {
  formatPurchaseAmount,
  PURCHASE_TYPES,
  type PurchaseType,
  type PurchaseWithRelations,
} from "@/lib/purchases";
import { createClient } from "@/lib/supabase/server";

type PurchasesPageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

export default async function PurchasesPage({
  searchParams,
}: PurchasesPageProps) {
  const params = await searchParams;
  const typeFilter = (params?.type ?? "all") as PurchaseType | "all";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const [
    { data, error },
    { data: businessesData, error: businessesError },
    { data: projectsData, error: projectsError },
  ] = await Promise.all([
    supabase
      .from("purchases")
      .select(
        `
        *,
        organizations (
          id,
          name
        ),
        projects (
          id,
          name
        )
      `,
      )
      .order("purchased_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
    supabase
      .from("projects")
      .select("id, name, organization_id")
      .order("name"),
  ]);

  if (error) {
    throw new Error(`Failed to load purchases: ${error.message}`);
  }
  if (businessesError) {
    throw new Error(`Failed to load businesses: ${businessesError.message}`);
  }
  if (projectsError) {
    throw new Error(`Failed to load projects: ${projectsError.message}`);
  }

  const purchases = (data ?? []) as PurchaseWithRelations[];
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="purchases" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Purchases
          </h1>
          <p className="mt-2 text-muted-foreground">
            Promo materials, equipment, and project-specific spend — not full
            inventory.
          </p>
        </div>
        <SignOutButton />
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
        <a
          className={
            typeFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href="/admin/purchases"
        >
          All ({purchases.length})
        </a>
        {PURCHASE_TYPES.map((type) => {
          const count = purchases.filter(
            (row) => row.purchase_type === type.value,
          ).length;
          const active = typeFilter === type.value;
          return (
            <a
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`/admin/purchases?type=${type.value}`}
              key={type.value}
            >
              {type.label} ({count})
            </a>
          );
        })}
      </nav>

      <PurchasesPanel
        businesses={businessesData ?? []}
        projects={projectsData ?? []}
        rows={rows}
      />
    </main>
  );
}
