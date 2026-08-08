import { redirect } from "next/navigation";

import { LeadsPanel } from "@/components/admin/leads-panel";
import { PipelinePhaseBar } from "@/components/admin/pipeline-phase-bar";
import type { ActivityRow } from "@/lib/activities";
import type { CalendarEventRow } from "@/lib/calendar";
import {
  isCustomerStage,
  LEAD_STAGES,
  type LeadRow,
  type LeadStage,
} from "@/lib/leads";
import {
  filterLeadsByPipelinePhase,
  isPipelinePhaseId,
  openLeadPipelinePhase,
  type PipelinePhaseId,
} from "@/lib/pipeline-phases";
import { createClient } from "@/lib/supabase/server";

function isLeadStage(value: string | undefined | null): value is LeadStage {
  return Boolean(value && LEAD_STAGES.some((stage) => stage.value === value));
}

export default async function PipelinePage({
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

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load leads: ${error.message}`);
  }

  const allLeads = (data ?? []) as LeadRow[];
  const openLeads = allLeads.filter((lead) => !isCustomerStage(lead.stage));
  const openLeadIds = openLeads.map((lead) => lead.id);

  const [
    activitiesResult,
    eventsResult,
    projectsResult,
    acceptedResult,
    agreementsResult,
    depositsResult,
  ] = await Promise.all([
    openLeadIds.length > 0
      ? supabase
          .from("activities")
          .select("*")
          .in("lead_id", openLeadIds)
          .order("occurred_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    openLeadIds.length > 0
      ? supabase
          .from("calendar_events")
          .select("*")
          .in("lead_id", openLeadIds)
          .order("starts_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .in("status", ["planning", "active"]),
    openLeadIds.length > 0
      ? supabase
          .from("proposals")
          .select("id, lead_id, status, issued_at, client_responded_at")
          .in("lead_id", openLeadIds)
          .order("issued_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    openLeadIds.length > 0
      ? supabase
          .from("agreements")
          .select("lead_id, status")
          .in("lead_id", openLeadIds)
          .in("status", ["draft", "sent"])
      : Promise.resolve({ data: [], error: null }),
    openLeadIds.length > 0
      ? supabase
          .from("invoices")
          .select("lead_id")
          .in("lead_id", openLeadIds)
          .eq("invoice_type", "deposit")
          .in("status", ["draft", "sent"])
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (activitiesResult.error) {
    throw new Error(
      `Failed to load activities: ${activitiesResult.error.message}`,
    );
  }
  if (eventsResult.error) {
    throw new Error(
      `Failed to load calendar events: ${eventsResult.error.message}`,
    );
  }
  if (projectsResult.error) {
    throw new Error(
      `Failed to load projects: ${projectsResult.error.message}`,
    );
  }
  if (acceptedResult.error) {
    throw new Error(
      `Failed to load proposals: ${acceptedResult.error.message}`,
    );
  }
  if (agreementsResult.error) {
    throw new Error(
      `Failed to load agreements: ${agreementsResult.error.message}`,
    );
  }
  if (depositsResult.error) {
    throw new Error(
      `Failed to load deposit invoices: ${depositsResult.error.message}`,
    );
  }

  const contractLeadIds = new Set(
    (agreementsResult.data ?? [])
      .map((row) => row.lead_id)
      .filter((id): id is string => Boolean(id)),
  );
  const depositLeadIds = new Set(
    (depositsResult.data ?? [])
      .map((row) => row.lead_id)
      .filter((id): id is string => Boolean(id)),
  );

  const activeProjectsCount = projectsResult.count ?? 0;

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

  const leadIds = leads.map((lead) => lead.id);
  const activities = (activitiesResult.data ?? []) as ActivityRow[];
  const calendarEvents = (eventsResult.data ?? []) as CalendarEventRow[];
  const proposalsForLeads = acceptedResult.data ?? [];

  const proposalByLeadId = proposalsForLeads.reduce<Record<string, string>>(
    (acc, proposal) => {
      if (!proposal.lead_id || acc[proposal.lead_id]) return acc;
      acc[proposal.lead_id] = proposal.id;
      return acc;
    },
    {},
  );

  const acceptedProposalByLeadId = [...proposalsForLeads]
    .filter((proposal) => proposal.status === "accepted")
    .sort((a, b) => {
      const aAt = a.client_responded_at ?? a.issued_at ?? "";
      const bAt = b.client_responded_at ?? b.issued_at ?? "";
      return bAt.localeCompare(aAt);
    })
    .reduce<Record<string, string>>((acc, proposal) => {
      if (!proposal.lead_id || acc[proposal.lead_id]) return acc;
      acc[proposal.lead_id] = proposal.id;
      return acc;
    }, {});

  const activitiesByLeadId = activities.reduce<Record<string, ActivityRow[]>>(
    (acc, activity) => {
      if (!activity.lead_id) return acc;
      const current = acc[activity.lead_id] ?? [];
      current.push(activity);
      acc[activity.lead_id] = current;
      return acc;
    },
    {},
  );

  const eventsByLeadId = calendarEvents.reduce<
    Record<string, CalendarEventRow[]>
  >((acc, event) => {
    if (!event.lead_id) return acc;
    const current = acc[event.lead_id] ?? [];
    current.push(event);
    acc[event.lead_id] = current;
    return acc;
  }, {});

  // Activities/events were loaded for all open leads; trim to visible rows.
  const visibleActivitiesByLeadId = Object.fromEntries(
    leadIds.map((id) => [id, activitiesByLeadId[id] ?? []]),
  );
  const visibleEventsByLeadId = Object.fromEntries(
    leadIds.map((id) => [id, eventsByLeadId[id] ?? []]),
  );

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
        clearHref="/crm/pipeline"
        items={[
          {
            id: "prospect",
            count: phaseCounts.prospect,
            href: "/crm/pipeline?phase=prospect",
          },
          {
            id: "accepted",
            count: phaseCounts.accepted,
            href: "/crm/pipeline?phase=accepted",
            emphasize: phaseCounts.accepted > 0,
          },
          {
            id: "contract",
            count: phaseCounts.contract,
            href: "/crm/pipeline?phase=contract",
            emphasize: phaseCounts.contract > 0,
          },
          {
            id: "deposit",
            count: phaseCounts.deposit,
            href: "/crm/pipeline?phase=deposit",
            emphasize: phaseCounts.deposit > 0,
          },
          {
            id: "project",
            count: activeProjectsCount,
            href: "/crm/projects",
          },
        ]}
      />

      <LeadsPanel
        acceptedProposalByLeadId={acceptedProposalByLeadId}
        activitiesByLeadId={visibleActivitiesByLeadId}
        eventsByLeadId={visibleEventsByLeadId}
        initialLeadId={initialLeadId}
        proposalByLeadId={proposalByLeadId}
        rows={leads}
      />
    </main>
  );
}
