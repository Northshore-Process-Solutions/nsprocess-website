import { redirect } from "next/navigation";

import { PortalHome } from "@/components/portal/portal-home";
import type { InvoiceRow } from "@/lib/invoices";
import type { LeadRow } from "@/lib/leads";
import type { ProposalRow } from "@/lib/proposals";
import type { ProjectWithOrganization } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

function todayDateOnly() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function daysAheadIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export default async function AdminTodayPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  const today = todayDateOnly();
  const weekOut = daysAheadIso(7);

  const [
    { data: followUpLeads },
    { data: consultLeads },
    { data: acceptedProposals },
    { data: proposalDrafts },
    { data: openInvoices },
    { data: upcomingEvents },
    { data: activeProjects },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .not("stage", "in", "(deposit_received,won,lost)")
      .or(`next_follow_up_at.is.null,next_follow_up_at.lte.${today}`)
      .order("next_follow_up_at", { ascending: true, nullsFirst: true })
      .limit(8),
    supabase
      .from("leads")
      .select("*")
      .in("stage", ["review_completed", "proposal_sent"])
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("proposals")
      .select("*")
      .eq("status", "accepted")
      .order("client_responded_at", { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from("proposals")
      .select("*")
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("*")
      .in("status", ["draft", "sent"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("calendar_events")
      .select("id, title, starts_at, event_type")
      .gte("starts_at", new Date().toISOString())
      .lte("starts_at", weekOut)
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase
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
      .in("status", ["planning", "active", "on_hold"])
      .order("next_action_at", { ascending: true, nullsFirst: false })
      .limit(6),
  ]);

  return (
    <PortalHome
      acceptedDeals={(acceptedProposals ?? []) as ProposalRow[]}
      drafts={(proposalDrafts ?? []) as ProposalRow[]}
      events={upcomingEvents ?? []}
      invoices={(openInvoices ?? []) as InvoiceRow[]}
      leadsDue={(followUpLeads ?? []) as LeadRow[]}
      mode="live"
      projects={(activeProjects ?? []) as ProjectWithOrganization[]}
      readyForBilling={(consultLeads ?? []) as LeadRow[]}
    />
  );
}
