import { redirect } from "next/navigation";

import { PortalHome } from "@/components/portal/portal-home";
import { isCustomerStage, type LeadRow } from "@/lib/leads";
import type { InvoiceRow } from "@/lib/invoices";
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
    { data: sentProposals },
    { data: openInvoices },
    { data: upcomingEvents },
    { data: activeProjects },
    { data: agreements },
    { data: customerLeads },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .not("stage", "in", "(deposit_received,won,lost,proposal_accepted)")
      .or(`next_follow_up_at.is.null,next_follow_up_at.lte.${today}`)
      .order("next_follow_up_at", { ascending: true, nullsFirst: true })
      .limit(8),
    supabase
      .from("leads")
      .select("*")
      .eq("stage", "review_completed")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("proposals")
      .select("*")
      .eq("status", "accepted")
      .order("client_responded_at", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from("proposals")
      .select("*")
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("proposals")
      .select("*")
      .eq("status", "sent")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("*")
      .in("status", ["draft", "sent"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(8),
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
    supabase
      .from("agreements")
      .select("id, status, proposal_id, lead_id")
      .in("status", ["draft", "sent", "signed"])
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("leads")
      .select("id, stage")
      .in("stage", ["deposit_received", "won"]),
  ]);

  const customerLeadIds = new Set(
    ((customerLeads ?? []) as Array<{ id: string; stage: string }>)
      .filter((lead) => isCustomerStage(lead.stage as LeadRow["stage"]))
      .map((lead) => lead.id),
  );

  return (
    <PortalHome
      acceptedProposals={(acceptedProposals ?? []) as ProposalRow[]}
      agreements={agreements ?? []}
      customerLeadIds={customerLeadIds}
      draftProposals={(proposalDrafts ?? []) as ProposalRow[]}
      events={upcomingEvents ?? []}
      invoices={(openInvoices ?? []) as InvoiceRow[]}
      leadsDue={(followUpLeads ?? []) as LeadRow[]}
      mode="live"
      projects={(activeProjects ?? []) as ProjectWithOrganization[]}
      readyToPropose={(consultLeads ?? []) as LeadRow[]}
      sentProposals={(sentProposals ?? []) as ProposalRow[]}
    />
  );
}
