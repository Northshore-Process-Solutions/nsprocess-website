import { redirect } from "next/navigation";

import { LeadsPanel } from "@/components/admin/leads-panel";
import type { ActivityRow } from "@/lib/activities";
import type { CalendarEventRow } from "@/lib/calendar";
import { isCustomerStage, type LeadRow } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

export default async function PipelinePage() {
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
  const leads = allLeads.filter((lead) => !isCustomerStage(lead.stage));
  const leadIds = leads.map((lead) => lead.id);
  let activities: ActivityRow[] = [];
  let calendarEvents: CalendarEventRow[] = [];
  let activeProjectsCount = 0;

  const [
    activitiesResult,
    eventsResult,
    projectsResult,
  ] = await Promise.all([
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

  activities = (activitiesResult.data ?? []) as ActivityRow[];
  calendarEvents = (eventsResult.data ?? []) as CalendarEventRow[];
  activeProjectsCount = projectsResult.count ?? 0;

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

  const kpis = [
    { label: "New Leads", value: countByStage("new_inquiry") },
    { label: "Consults Booked", value: countByStage("review_booked") },
    { label: "Proposals Sent", value: countByStage("proposal_sent") },
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
          Open inquiries through consult and proposal. Deposit and kickoff move customers into Projects.
        </p>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            className="rounded-md border border-slate-200 bg-white px-3 py-3"
            key={kpi.label}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      <LeadsPanel
        activitiesByLeadId={activitiesByLeadId}
        eventsByLeadId={eventsByLeadId}
        rows={leads}
      />
    </main>
  );
}
