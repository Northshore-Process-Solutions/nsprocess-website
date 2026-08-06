import { LeadsPanel } from "@/components/admin/leads-panel";
import { loadDemoCrmData } from "@/lib/demo/data";
import { isCustomerStage } from "@/lib/leads";

export const metadata = {
  title: "Demo Pipeline",
  robots: { index: false, follow: false },
};

export default async function DemoPipelinePage() {
  const data = await loadDemoCrmData();
  const allLeads = data.leads;
  const leads = allLeads.filter((lead) => !isCustomerStage(lead.stage));
  const activeProjectsCount = data.projects.filter((project) =>
    ["planning", "active"].includes(project.status),
  ).length;

  const countByStage = (stage: (typeof allLeads)[number]["stage"]) =>
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
          Open inquiries through consult and proposal. Deposit and kickoff move
          customers into Projects.
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
        activitiesByLeadId={data.activitiesByLeadId}
        eventsByLeadId={data.eventsByLeadId}
        readOnly
        rows={leads}
      />
    </main>
  );
}
