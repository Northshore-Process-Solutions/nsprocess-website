import Link from "next/link";

import { LeadsPanel } from "@/components/admin/leads-panel";
import { loadDemoCrmData } from "@/lib/demo/data";
import {
  isCustomerStage,
  LEAD_STAGES,
  type LeadStage,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Demo Pipeline",
  robots: { index: false, follow: false },
};

function isLeadStage(value: string | undefined | null): value is LeadStage {
  return Boolean(value && LEAD_STAGES.some((stage) => stage.value === value));
}

export default async function DemoPipelinePage({
  searchParams,
}: {
  searchParams?: Promise<{
    leadId?: string;
    stage?: string;
  }>;
}) {
  const params = await searchParams;
  const initialLeadId = params?.leadId ?? null;
  const stageFilter = isLeadStage(params?.stage) ? params.stage : null;
  const data = await loadDemoCrmData();
  const allLeads = data.leads;
  const openLeads = allLeads.filter((lead) => !isCustomerStage(lead.stage));
  const leads = (
    stageFilter
      ? openLeads.filter((lead) => lead.stage === stageFilter)
      : openLeads
  ).sort((a, b) => {
    if (a.stage === "proposal_accepted" && b.stage !== "proposal_accepted") {
      return -1;
    }
    if (b.stage === "proposal_accepted" && a.stage !== "proposal_accepted") {
      return 1;
    }
    return 0;
  });
  const activeProjectsCount = data.projects.filter((project) =>
    ["planning", "active"].includes(project.status),
  ).length;

  const countByStage = (stage: (typeof allLeads)[number]["stage"]) =>
    allLeads.filter((lead) => lead.stage === stage).length;

  const acceptedCount = countByStage("proposal_accepted");

  const kpis: Array<{
    label: string;
    value: number;
    href?: string;
    emphasize?: boolean;
  }> = [
    { label: "New Leads", value: countByStage("new_inquiry") },
    { label: "Consults Booked", value: countByStage("review_booked") },
    {
      label: "Accepted — next step",
      value: acceptedCount,
      href: "/demo/pipeline?stage=proposal_accepted",
      emphasize: acceptedCount > 0,
    },
    { label: "Active Projects", value: activeProjectsCount },
    { label: "Awaiting Follow-Up", value: countByStage("follow_up") },
  ];

  const acceptedProposalByLeadId = data.proposals
    .filter((proposal) => proposal.status === "accepted" && proposal.lead_id)
    .reduce<Record<string, string>>((acc, proposal) => {
      if (!proposal.lead_id || acc[proposal.lead_id]) return acc;
      acc[proposal.lead_id] = proposal.id;
      return acc;
    }, {});

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sales work through proposal acceptance. After accept: agreement →
          deposit invoice. Deposit paid moves the customer into Projects.
        </p>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const cardClass = cn(
            "rounded-md border px-3 py-3",
            kpi.emphasize
              ? "border-lime-300 bg-lime-50"
              : "border-slate-200 bg-white",
          );
          const body = (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {kpi.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {kpi.value}
              </p>
            </>
          );
          return kpi.href ? (
            <Link
              className={cn(cardClass, "transition hover:border-slate-400")}
              href={kpi.href}
              key={kpi.label}
            >
              {body}
            </Link>
          ) : (
            <div className={cardClass} key={kpi.label}>
              {body}
            </div>
          );
        })}
      </section>

      {stageFilter === "proposal_accepted" ? (
        <div className="mb-4 flex flex-col gap-2 rounded-md border border-lime-200 bg-lime-50 px-3 py-3 text-sm text-lime-950 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing accepted proposals waiting on agreement and deposit. They
            leave Pipeline when deposit is marked paid.
          </p>
          <Link
            className="shrink-0 text-xs font-semibold text-lime-900 underline-offset-2 hover:underline"
            href="/demo/pipeline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      <LeadsPanel
        acceptedProposalByLeadId={acceptedProposalByLeadId}
        activitiesByLeadId={data.activitiesByLeadId}
        eventsByLeadId={data.eventsByLeadId}
        initialLeadId={initialLeadId}
        readOnly
        rows={leads}
      />
    </main>
  );
}
