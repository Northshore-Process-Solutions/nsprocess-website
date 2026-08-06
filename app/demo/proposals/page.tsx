import Link from "next/link";
import { FileText, Send } from "lucide-react";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { ProposalsPanel } from "@/components/admin/proposals-panel";
import { loadDemoCrmData } from "@/lib/demo/data";
import { portalPath } from "@/lib/portal/paths";
import {
  formatProposalMoney,
  PROPOSAL_STATUSES,
  type ProposalStatus,
} from "@/lib/proposals";

export const metadata = {
  title: "Demo Proposals",
  robots: { index: false, follow: false },
};

type DemoProposalsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function DemoProposalsPage({
  searchParams,
}: DemoProposalsPageProps) {
  const params = await searchParams;
  const statusFilter = (params?.status ?? "all") as ProposalStatus | "all";
  const data = await loadDemoCrmData();
  const base = portalPath("demo");

  const proposals = data.proposals.map((row) => ({
    ...row,
    proposal_items: [],
  }));

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
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Proposals
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Draft scope and investment after a consult, then print a PDF for the
          client.
        </p>
        <BillingSubnav current="proposals" />
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
        <Link
          className={
            statusFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href={`${base}/proposals`}
        >
          All ({proposals.length})
        </Link>
        {PROPOSAL_STATUSES.map((status) => {
          const count = proposals.filter(
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
              href={`${base}/proposals?status=${status.value}`}
              key={status.value}
            >
              {status.label} ({count})
            </Link>
          );
        })}
      </nav>

      <ProposalsPanel readOnly rows={rows} />
    </main>
  );
}
