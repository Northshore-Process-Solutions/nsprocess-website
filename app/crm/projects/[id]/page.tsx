import { notFound, redirect } from "next/navigation";

import { ProjectDetail } from "@/components/admin/project-detail";
import type { ActivityRow } from "@/lib/activities";
import type { CalendarEventWithRelations } from "@/lib/calendar";
import type { LeadRow } from "@/lib/leads";
import type { ProjectTaskRow, ProjectWithOrganization } from "@/lib/projects";
import type { PurchaseWithRelations } from "@/lib/purchases";
import { createClient } from "@/lib/supabase/server";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      organizations (
        id,
        name
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load project: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  const project = data as ProjectWithOrganization;

  const leadPromise = project.lead_id
    ? supabase.from("leads").select("*").eq("id", project.lead_id).maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [
    { data: leadData, error: leadError },
    { data: activitiesData, error: activitiesError },
    { data: eventsData, error: eventsError },
    { data: tasksData, error: tasksError },
    { data: purchasesData, error: purchasesError },
  ] = await Promise.all([
    leadPromise,
    supabase
      .from("activities")
      .select("*")
      .or(
        project.lead_id
          ? `project_id.eq.${id},lead_id.eq.${project.lead_id}`
          : `project_id.eq.${id}`,
      )
      .order("occurred_at", { ascending: false }),
    supabase
      .from("calendar_events")
      .select(
        `
        *,
        leads (
          id,
          business_name,
          contact_name
        ),
        organizations (
          id,
          name
        )
      `,
      )
      .or(
        project.lead_id
          ? `project_id.eq.${id},lead_id.eq.${project.lead_id}`
          : `project_id.eq.${id}`,
      )
      .order("starts_at", { ascending: true }),
    supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", id)
      .order("is_done", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("purchases")
      .select(
        `
        *,
        organizations (
          id,
          name
        ),
        projects (
          id,
          name
        )
      `,
      )
      .eq("project_id", id)
      .order("purchased_at", { ascending: false }),
  ]);

  if (leadError) {
    throw new Error(`Failed to load lead: ${leadError.message}`);
  }
  if (activitiesError) {
    throw new Error(`Failed to load activities: ${activitiesError.message}`);
  }
  if (eventsError) {
    throw new Error(`Failed to load calendar events: ${eventsError.message}`);
  }
  if (tasksError) {
    throw new Error(`Failed to load tasks: ${tasksError.message}`);
  }
  if (purchasesError) {
    throw new Error(`Failed to load purchases: ${purchasesError.message}`);
  }

  // Deduplicate if both project_id and lead_id match the same row.
  const activities = Array.from(
    new Map(
      ((activitiesData ?? []) as ActivityRow[]).map((row) => [row.id, row]),
    ).values(),
  );
  const events = Array.from(
    new Map(
      ((eventsData ?? []) as CalendarEventWithRelations[]).map((row) => [
        row.id,
        row,
      ]),
    ).values(),
  );
  const tasks = (tasksData ?? []) as ProjectTaskRow[];
  const purchases = (purchasesData ?? []) as PurchaseWithRelations[];

  return (
    <main>

      <ProjectDetail
        activities={activities}
        events={events}
        lead={(leadData as LeadRow | null) ?? null}
        project={project}
        purchases={purchases}
        tasks={tasks}
      />
    </main>
  );
}
