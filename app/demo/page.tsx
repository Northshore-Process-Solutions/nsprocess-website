import { redirect } from "next/navigation";

import { PortalHome } from "@/components/portal/portal-home";
import { mapDemoSeedToCrm } from "@/lib/demo/map-to-crm";
import { isCustomerStage } from "@/lib/leads";
import { requireReadyDemoSession } from "@/lib/demo/session";

export const metadata = {
  title: "Demo Home",
  robots: { index: false, follow: false },
};

type DemoHomePageProps = {
  searchParams?: Promise<{ expired?: string }>;
};

function todayDateOnly() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function daysAheadIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export default async function DemoHomePage({ searchParams }: DemoHomePageProps) {
  const params = await searchParams;
  if (params?.expired === "1") {
    redirect("/demo/start?expired=1");
  }

  const { session, error } = await requireReadyDemoSession();
  if (!session?.seed) {
    redirect(
      error?.includes("expired") ? "/demo/start?expired=1" : "/demo/start",
    );
  }

  const data = mapDemoSeedToCrm(session.seed);
  const today = todayDateOnly();
  const weekOut = daysAheadIso(7);

  const leadsDue = data.leads.filter(
    (lead) =>
      !["deposit_received", "won", "lost", "proposal_accepted"].includes(
        lead.stage,
      ) &&
      (lead.stage === "new_inquiry" ||
        !lead.next_follow_up_at ||
        lead.next_follow_up_at <= today),
  );

  const readyToPropose = data.leads.filter(
    (lead) => lead.stage === "review_completed",
  );

  const acceptedProposals = data.proposals.filter(
    (row) => row.status === "accepted",
  );

  const draftProposals = data.proposals.filter((row) => row.status === "draft");
  const sentProposals = data.proposals.filter((row) => row.status === "sent");

  const openInvoices = data.invoices.filter((row) =>
    ["draft", "sent"].includes(row.status),
  );

  const events = data.events.filter(
    (event) =>
      event.starts_at >= new Date().toISOString() &&
      event.starts_at <= weekOut,
  );

  const activeProjects = data.projects.filter((project) =>
    ["planning", "active", "on_hold"].includes(project.status),
  );

  const customerLeadIds = new Set(
    data.leads.filter((lead) => isCustomerStage(lead.stage)).map((lead) => lead.id),
  );

  const agreements = data.agreements
    .filter((row) => ["draft", "sent", "signed"].includes(row.status))
    .map((row) => ({
      id: row.id,
      status: row.status,
      proposal_id: row.proposal_id,
      lead_id: row.lead_id,
    }));

  return (
    <PortalHome
      acceptedProposals={acceptedProposals}
      agreements={agreements}
      customerLeadIds={customerLeadIds}
      draftProposals={draftProposals}
      events={events}
      invoices={openInvoices}
      leadsDue={leadsDue}
      mode="demo"
      projects={activeProjects}
      readyToPropose={readyToPropose}
      sentProposals={sentProposals}
    />
  );
}
