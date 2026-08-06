import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/admin/project-detail";
import { loadDemoCrmData } from "@/lib/demo/data";
import { findDemoProject } from "@/lib/demo/map-to-crm";
import type { CalendarEventWithRelations } from "@/lib/calendar";

export const metadata = {
  title: "Demo Project",
  robots: { index: false, follow: false },
};

export default async function DemoProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadDemoCrmData();
  const project = findDemoProject(data, id);
  if (!project) notFound();

  const lead = project.lead_id
    ? (data.leads.find((row) => row.id === project.lead_id) ?? null)
    : null;

  const activities = data.activities.filter(
    (row) =>
      row.project_id === id ||
      (project.lead_id && row.lead_id === project.lead_id),
  );

  const events = data.events
    .filter(
      (row) =>
        row.project_id === id ||
        (project.lead_id && row.lead_id === project.lead_id),
    )
    .map((event) => {
      const eventLead = event.lead_id
        ? data.leads.find((row) => row.id === event.lead_id)
        : null;
      const org = event.organization_id
        ? data.organizations.find((row) => row.id === event.organization_id)
        : null;

      return {
        ...event,
        leads: eventLead
          ? {
              id: eventLead.id,
              business_name: eventLead.business_name,
              contact_name: eventLead.contact_name,
            }
          : null,
        organizations: org ? { id: org.id, name: org.name } : null,
      } satisfies CalendarEventWithRelations;
    });

  const purchases = data.purchases.filter((row) => row.project_id === id);

  return (
    <main>
      <ProjectDetail
        activities={activities}
        events={events}
        lead={lead}
        project={project}
        purchases={purchases}
        readOnly
        tasks={[]}
      />
    </main>
  );
}
