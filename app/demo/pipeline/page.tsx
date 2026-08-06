import { LeadsPanel } from "@/components/admin/leads-panel";
import { PipelinePhaseBar } from "@/components/admin/pipeline-phase-bar";
import { loadDemoCrmData } from "@/lib/demo/data";
import {
  isCustomerStage,
  LEAD_STAGES,
  type LeadStage,
} from "@/lib/leads";
import {
  filterLeadsByPipelinePhase,
  isPipelinePhaseId,
  openLeadPipelinePhase,
  type PipelinePhaseId,
} from "@/lib/pipeline-phases";

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
    phase?: string;
  }>;
}) {
  const params = await searchParams;
  const initialLeadId = params?.leadId ?? null;
  const stageFilter = isLeadStage(params?.stage) ? params.stage : null;
  const phaseFilter = isPipelinePhaseId(params?.phase) ? params.phase : null;
  const data = await loadDemoCrmData();
  const allLeads = data.leads;
  const openLeads = allLeads.filter((lead) => !isCustomerStage(lead.stage));

  const contractLeadIds = new Set(
    data.agreements
      .filter(
        (agreement) =>
          agreement.lead_id &&
          (agreement.status === "draft" || agreement.status === "sent"),
      )
      .map((agreement) => agreement.lead_id as string),
  );
  const depositLeadIds = new Set(
    data.invoices
      .filter(
        (invoice) =>
          invoice.lead_id &&
          invoice.invoice_type === "deposit" &&
          (invoice.status === "draft" || invoice.status === "sent"),
      )
      .map((invoice) => invoice.lead_id as string),
  );

  const activeProjectsCount = data.projects.filter((project) =>
    ["planning", "active"].includes(project.status),
  ).length;

  const phaseCounts: Record<Exclude<PipelinePhaseId, "project">, number> = {
    prospect: 0,
    accepted: 0,
    contract: 0,
    deposit: 0,
  };
  for (const lead of openLeads) {
    const phase = openLeadPipelinePhase(lead, contractLeadIds, depositLeadIds);
    if (phase) phaseCounts[phase] += 1;
  }

  let leads = openLeads;
  if (phaseFilter && phaseFilter !== "project") {
    leads = filterLeadsByPipelinePhase(
      openLeads,
      phaseFilter,
      contractLeadIds,
      depositLeadIds,
    );
  } else if (stageFilter) {
    leads = openLeads.filter((lead) => lead.stage === stageFilter);
  }

  leads = [...leads].sort((a, b) => {
    if (a.stage === "proposal_accepted" && b.stage !== "proposal_accepted") {
      return -1;
    }
    if (b.stage === "proposal_accepted" && a.stage !== "proposal_accepted") {
      return 1;
    }
    return 0;
  });

  const acceptedProposalByLeadId = data.proposals
    .filter((proposal) => proposal.status === "accepted" && proposal.lead_id)
    .reduce<Record<string, string>>((acc, proposal) => {
      if (!proposal.lead_id || acc[proposal.lead_id]) return acc;
      acc[proposal.lead_id] = proposal.id;
      return acc;
    }, {});

  const activePhase: PipelinePhaseId | null =
    phaseFilter ??
    (stageFilter === "proposal_accepted" ? "accepted" : null);

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Prospect → accept → contract → deposit. Paid deposits move customers
          into Projects.
        </p>
      </header>

      <PipelinePhaseBar
        activePhase={activePhase}
        clearHref="/demo/pipeline"
        items={[
          {
            id: "prospect",
            count: phaseCounts.prospect,
            href: "/demo/pipeline?phase=prospect",
          },
          {
            id: "accepted",
            count: phaseCounts.accepted,
            href: "/demo/pipeline?phase=accepted",
            emphasize: phaseCounts.accepted > 0,
          },
          {
            id: "contract",
            count: phaseCounts.contract,
            href: "/demo/pipeline?phase=contract",
            emphasize: phaseCounts.contract > 0,
          },
          {
            id: "deposit",
            count: phaseCounts.deposit,
            href: "/demo/pipeline?phase=deposit",
            emphasize: phaseCounts.deposit > 0,
          },
          {
            id: "project",
            count: activeProjectsCount,
            href: "/demo/projects",
          },
        ]}
      />

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
