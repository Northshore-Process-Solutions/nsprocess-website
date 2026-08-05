import { redirect } from "next/navigation";
import { FileText, PenLine } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { AgreementsPanel } from "@/components/admin/agreements-panel";
import { BillingSubnav } from "@/components/admin/billing-subnav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import {
  AGREEMENT_STATUSES,
  type AgreementStatus,
  type AgreementWithItems,
} from "@/lib/agreements";
import { formatMoney } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

type AgreementsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function AgreementsPage({
  searchParams,
}: AgreementsPageProps) {
  const params = await searchParams;
  const statusFilter = (params?.status ?? "all") as AgreementStatus | "all";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("agreements")
    .select(
      `
      *,
      agreement_items (
        id,
        agreement_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      ),
      proposals (
        id,
        proposal_number,
        title
      ),
      organizations (
        id,
        name
      )
    `,
    )
    .order("issued_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load agreements: ${error.message}`);
  }

  const agreements = (data ?? []) as AgreementWithItems[];
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
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="billing" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Agreements
          </h1>
          <p className="mt-2 text-muted-foreground">
            Turn accepted proposals into signed agreements and print PDFs for
            clients.
          </p>
          <BillingSubnav current="agreements" />
        </div>
        <SignOutButton />
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
        <a
          className={
            statusFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href="/admin/agreements"
        >
          All ({agreements.length})
        </a>
        {AGREEMENT_STATUSES.map((status) => {
          const count = agreements.filter(
            (row) => row.status === status.value,
          ).length;
          const active = statusFilter === status.value;
          return (
            <a
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`/admin/agreements?status=${status.value}`}
              key={status.value}
            >
              {status.label} ({count})
            </a>
          );
        })}
      </nav>

      <AgreementsPanel rows={rows} />
    </main>
  );
}
