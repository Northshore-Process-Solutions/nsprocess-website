import { redirect } from "next/navigation";

import { PortalHome } from "@/components/portal/portal-home";
import { mapDemoSeedToCrm } from "@/lib/demo/map-to-crm";
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
      !["deposit_received", "won", "lost"].includes(lead.stage) &&
      (!lead.next_follow_up_at || lead.next_follow_up_at <= today),
  );

  const readyForBilling = data.leads.filter((lead) =>
    ["review_completed", "proposal_sent", "proposal_accepted"].includes(
      lead.stage,
    ),
  );

  const drafts = data.proposals.filter((row) => row.status === "draft");

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

  return (
    <PortalHome
      drafts={drafts}
      events={events}
      invoices={openInvoices}
      leadsDue={leadsDue}
      mode="demo"
      projects={activeProjects}
      readyForBilling={readyForBilling}
    />
  );
}
