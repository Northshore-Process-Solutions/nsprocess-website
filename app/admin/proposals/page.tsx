import { redirect } from "next/navigation";
import { FileText, Send } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProposalsPanel } from "@/components/admin/proposals-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import {
  formatProposalMoney,
  PROPOSAL_STATUSES,
  type ProposalStatus,
  type ProposalWithItems,
} from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";

type ProposalsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function ProposalsPage({
  searchParams,
}: ProposalsPageProps) {
  const params = await searchParams;
  const statusFilter = (params?.status ?? "all") as ProposalStatus | "all";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      *,
      proposal_items (
        id,
        proposal_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      ),
      leads (
        id,
        business_name,
        stage
      ),
      organizations (
        id,
        name
      )
    `,
    )
    .order("issued_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load proposals: ${error.message}`);
  }

  const proposals = (data ?? []) as ProposalWithItems[];
  const rows =
    statusFilter === "all"
      ? proposals
      : proposals.filter((row) => row.status === statusFilter);

  const draftCount = proposals.filter((row) => row.status === "draft").length;
  const sentCount = proposals.filter((row) => row.status === "sent").length;
  const pipelineValue = proposals
    .filter((row) => row.status === "draft" || row.status === "sent")
    .reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="proposals" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Proposals
          </h1>
          <p className="mt-2 text-muted-foreground">
            Draft scope and investment after a consult, then print a PDF for the
            client.
          </p>
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
            <Send aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold">{sentCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div>
            <p className="text-sm text-muted-foreground">Open pipeline value</p>
            <p className="text-2xl font-bold">
              {formatProposalMoney(pipelineValue)}
            </p>
          </div>
        </div>
      </section>

      <nav
        aria-label="Proposal status filters"
        className="mb-5 flex flex-wrap gap-2"
      >
        <a
          className={
            statusFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href="/admin/proposals"
        >
          All ({proposals.length})
        </a>
        {PROPOSAL_STATUSES.map((status) => {
          const count = proposals.filter(
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
              href={`/admin/proposals?status=${status.value}`}
              key={status.value}
            >
              {status.label} ({count})
            </a>
          );
        })}
      </nav>

      <ProposalsPanel rows={rows} />
    </main>
  );
}
