import type { LeadRow, LeadStage } from "@/lib/leads";

export type PipelinePhaseId =
  | "prospect"
  | "accepted"
  | "contract"
  | "deposit"
  | "project";

export const PROSPECT_STAGES: LeadStage[] = [
  "new_inquiry",
  "follow_up",
  "review_booked",
  "review_completed",
  "proposal_sent",
];

export const PIPELINE_PHASES: Array<{
  id: PipelinePhaseId;
  label: string;
  description: string;
}> = [
  {
    id: "prospect",
    label: "Prospect",
    description: "Inquiry through proposal sent",
  },
  {
    id: "accepted",
    label: "Accepted",
    description: "Proposal accepted — create agreement",
  },
  {
    id: "contract",
    label: "Contract",
    description: "Agreement awaiting signature",
  },
  {
    id: "deposit",
    label: "Deposit",
    description: "Deposit invoice unpaid",
  },
  {
    id: "project",
    label: "Project",
    description: "Active delivery work",
  },
];

export function isPipelinePhaseId(
  value: string | undefined | null,
): value is PipelinePhaseId {
  return Boolean(value && PIPELINE_PHASES.some((phase) => phase.id === value));
}

/** Sales-phase placement for an open (non-customer) lead. */
export function openLeadPipelinePhase(
  lead: Pick<LeadRow, "id" | "stage">,
  contractLeadIds: Set<string>,
  depositLeadIds: Set<string>,
): Exclude<PipelinePhaseId, "project"> | null {
  if (depositLeadIds.has(lead.id)) return "deposit";
  if (contractLeadIds.has(lead.id)) return "contract";
  if (lead.stage === "proposal_accepted") return "accepted";
  if (PROSPECT_STAGES.includes(lead.stage)) return "prospect";
  return null;
}

export function filterLeadsByPipelinePhase(
  leads: LeadRow[],
  phase: Exclude<PipelinePhaseId, "project">,
  contractLeadIds: Set<string>,
  depositLeadIds: Set<string>,
) {
  return leads.filter(
    (lead) =>
      openLeadPipelinePhase(lead, contractLeadIds, depositLeadIds) === phase,
  );
}

export function pipelinePhaseLabel(phase: PipelinePhaseId) {
  return PIPELINE_PHASES.find((item) => item.id === phase)?.label ?? phase;
}
