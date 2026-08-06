import Link from "next/link";
import { redirect } from "next/navigation";

import { LeadsPanel } from "@/components/admin/leads-panel";
import type { ActivityRow } from "@/lib/activities";
import type { CalendarEventRow } from "@/lib/calendar";
import {
  isCustomerStage,
  LEAD_STAGES,
  type LeadRow,
  type LeadStage,
} from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function isLeadStage(value: string | undefined | null): value is LeadStage {
  return Boolean(value && LEAD_STAGES.some((stage) => stage.value === value));
}

export default async function PipelinePage({
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
  const leads = (
    stageFilter
      ? openLeads.filter((lead) => lead.stage === stageFilter)
      : openLeads
  ).sort((a, b) => {
    // Keep accepted deals near the top so the close-the-deal queue is obvious.
    if (a.stage === "proposal_accepted" && b.stage !== "proposal_accepted") {
      return -1;
    }
    if (b.stage === "proposal_accepted" && a.stage !== "proposal_accepted") {
      return 1;
    }
    return 0;
  });
  const leadIds = leads.map((lead) => lead.id);

  const [activitiesResult, eventsResult, projectsResult, acceptedResult] =
    await Promise.all([
    leadIds.length > 0
      ? supabase
          .from("activities")
          .select("*")
          .in("lead_id", leadIds)
          .order("occurred_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    leadIds.length > 0
      ? supabase
          .from("calendar_events")
          .select("*")
          .in("lead_id", leadIds)
          .order("starts_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .in("status", ["planning", "active"]),
    leadIds.length > 0
      ? supabase
          .from("proposals")
          .select("id, lead_id")
          .eq("status", "accepted")
          .in("lead_id", leadIds)
          .order("client_responded_at", { ascending: false, nullsFirst: false })
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
      `Failed to load accepted proposals: ${acceptedResult.error.message}`,
    );
  }

  const activities = (activitiesResult.data ?? []) as ActivityRow[];
  const calendarEvents = (eventsResult.data ?? []) as CalendarEventRow[];
  const activeProjectsCount = projectsResult.count ?? 0;
  const acceptedProposalByLeadId = (
    acceptedResult.data ?? []
  ).reduce<Record<string, string>>((acc, proposal) => {
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

  const countByStage = (stage: LeadRow["stage"]) =>
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
      href: "/crm/pipeline?stage=proposal_accepted",
      emphasize: acceptedCount > 0,
    },
    { label: "Active Projects", value: activeProjectsCount },
    { label: "Awaiting Follow-Up", value: countByStage("follow_up") },
  ];

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
            <Link className={cn(cardClass, "transition hover:border-slate-400")} href={kpi.href} key={kpi.label}>
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
            href="/crm/pipeline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      <LeadsPanel
        acceptedProposalByLeadId={acceptedProposalByLeadId}
        activitiesByLeadId={activitiesByLeadId}
        eventsByLeadId={eventsByLeadId}
        initialLeadId={initialLeadId}
        rows={leads}
      />
    </main>
  );
}
