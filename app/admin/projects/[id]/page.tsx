import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProjectDetail } from "@/components/admin/project-detail";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import type { ActivityRow } from "@/lib/activities";
import type { CalendarEventWithRelations } from "@/lib/calendar";
import type { LeadRow } from "@/lib/leads";
import type { ProjectWithOrganization } from "@/lib/projects";
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
    redirect("/admin/login");
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="projects" />
        </div>
        <SignOutButton />
      </header>

      <ProjectDetail
        activities={activities}
        events={events}
        lead={(leadData as LeadRow | null) ?? null}
        project={project}
      />
    </main>
  );
}
