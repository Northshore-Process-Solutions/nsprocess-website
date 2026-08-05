import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { OrganizationDetail } from "@/components/admin/organization-detail";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import type { ActivityRow } from "@/lib/activities";
import {
  mapOrganizationToCrmRow,
  type OrganizationRow,
} from "@/lib/crm";
import type { LeadRow } from "@/lib/leads";
import type { ProjectRow } from "@/lib/projects";
import type { PurchaseWithRelations } from "@/lib/purchases";
import type { ProposalWithItems } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";

type OrganizationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      category,
      website,
      email,
      phone,
      city,
      state,
      status,
      notes,
      organization_relationships (
        id,
        relationship_type,
        lifecycle_stage
      ),
      organization_contacts (
        id,
        title,
        is_primary,
        contact_id,
        contacts (
          id,
          first_name,
          last_name,
          display_name,
          email,
          phone
        )
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  const [
    { data: leadsData, error: leadsError },
    { data: projectsData, error: projectsError },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (leadsError) {
    throw new Error(`Failed to load linked leads: ${leadsError.message}`);
  }
  if (projectsError) {
    throw new Error(`Failed to load projects: ${projectsError.message}`);
  }

  const leads = (leadsData ?? []) as LeadRow[];
  const projects = (projectsData ?? []) as ProjectRow[];
  const leadIds = leads.map((lead) => lead.id);
  const projectIds = projects.map((project) => project.id);

  let activitiesQuery = supabase
    .from("activities")
    .select("*")
    .order("occurred_at", { ascending: false });

  if (leadIds.length > 0) {
    activitiesQuery = activitiesQuery.or(
      `organization_id.eq.${id},lead_id.in.(${leadIds.join(",")})`,
    );
  } else {
    activitiesQuery = activitiesQuery.eq("organization_id", id);
  }

  let purchasesQuery = supabase
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
    .order("purchased_at", { ascending: false });

  if (projectIds.length > 0) {
    purchasesQuery = purchasesQuery.or(
      `organization_id.eq.${id},project_id.in.(${projectIds.join(",")})`,
    );
  } else {
    purchasesQuery = purchasesQuery.eq("organization_id", id);
  }

  let proposalsQuery = supabase
    .from("proposals")
    .select(
      `
      *,
      proposal_items (
        id,
        proposal_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      )
    `,
    )
    .order("issued_at", { ascending: false });

  if (leadIds.length > 0) {
    proposalsQuery = proposalsQuery.or(
      `organization_id.eq.${id},lead_id.in.(${leadIds.join(",")})`,
    );
  } else {
    proposalsQuery = proposalsQuery.eq("organization_id", id);
  }

  const [
    { data: activitiesData, error: activitiesError },
    { data: purchasesData, error: purchasesError },
    { data: proposalsData, error: proposalsError },
  ] = await Promise.all([activitiesQuery, purchasesQuery, proposalsQuery]);

  if (activitiesError) {
    throw new Error(`Failed to load activities: ${activitiesError.message}`);
  }
  if (purchasesError) {
    throw new Error(`Failed to load purchases: ${purchasesError.message}`);
  }
  if (proposalsError) {
    throw new Error(`Failed to load proposals: ${proposalsError.message}`);
  }

  const organization = mapOrganizationToCrmRow(
    data as unknown as OrganizationRow,
  );
  const activities = (activitiesData ?? []) as ActivityRow[];
  const purchases = Array.from(
    new Map(
      ((purchasesData ?? []) as PurchaseWithRelations[]).map((row) => [
        row.id,
        row,
      ]),
    ).values(),
  );
  const proposals = Array.from(
    new Map(
      ((proposalsData ?? []) as ProposalWithItems[]).map((row) => [
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
          <AdminNav current="crm" />
        </div>
        <SignOutButton />
      </header>

      <OrganizationDetail
        activities={activities}
        leads={leads}
        organization={organization}
        projects={projects}
        proposals={proposals}
        purchases={purchases}
      />
    </main>
  );
}
