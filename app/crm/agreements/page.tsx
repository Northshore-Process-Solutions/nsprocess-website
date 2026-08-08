import { redirect } from "next/navigation";
import { FileText, PenLine } from "lucide-react";

import { AgreementsPanel } from "@/components/admin/agreements-panel";
import { SalesSubnav } from "@/components/admin/sales-subnav";
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
    redirect("/crm/login");
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
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Agreements
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Turn an accepted proposal into the binding contract clients sign — then
          issue the deposit invoice.
        </p>
        <SalesSubnav current="agreements" />
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
          href="/crm/agreements"
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
              href={`/crm/agreements?status=${status.value}`}
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
