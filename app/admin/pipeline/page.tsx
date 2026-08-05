import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { LeadsPanel } from "@/components/admin/leads-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import type { ActivityRow } from "@/lib/activities";
import type { CalendarEventRow } from "@/lib/calendar";
import type { LeadRow } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load leads: ${error.message}`);
  }

  const leads = (data ?? []) as LeadRow[];
  const leadIds = leads.map((lead) => lead.id);
  let activities: ActivityRow[] = [];
  let calendarEvents: CalendarEventRow[] = [];

  if (leadIds.length > 0) {
    const [
      { data: activitiesData, error: activitiesError },
      { data: eventsData, error: eventsError },
    ] = await Promise.all([
      supabase
        .from("activities")
        .select("*")
        .in("lead_id", leadIds)
        .order("occurred_at", { ascending: false }),
      supabase
        .from("calendar_events")
        .select("*")
        .in("lead_id", leadIds)
        .order("starts_at", { ascending: true }),
    ]);

    if (activitiesError) {
      throw new Error(`Failed to load activities: ${activitiesError.message}`);
    }
    if (eventsError) {
      throw new Error(`Failed to load calendar events: ${eventsError.message}`);
    }

    activities = (activitiesData ?? []) as ActivityRow[];
    calendarEvents = (eventsData ?? []) as CalendarEventRow[];
  }

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
    leads.filter((lead) => lead.stage === stage).length;

  const kpis = [
    { label: "New Leads", value: countByStage("new_inquiry") },
    { label: "Consults Booked", value: countByStage("review_booked") },
    { label: "Proposals Sent", value: countByStage("proposal_sent") },
    { label: "Deposits Received", value: countByStage("deposit_received") },
    { label: "Awaiting Follow-Up", value: countByStage("follow_up") },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="pipeline" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Pipeline
          </h1>
          <p className="mt-2 text-muted-foreground">
            From inquiry and scheduling through consult, proposal, deposit, and
            project kickoff.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft"
            key={kpi.label}
          >
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{kpi.value}</p>
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
