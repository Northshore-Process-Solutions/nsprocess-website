import { notFound, redirect } from "next/navigation";

import { OrganizationDetail } from "@/components/admin/organization-detail";
import type { ActivityRow } from "@/lib/activities";
import type { AgreementRow } from "@/lib/agreements";
import {
  mapOrganizationToCrmRow,
  type OrganizationRow,
} from "@/lib/crm";
import type { InvoiceRow } from "@/lib/invoices";
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

function dedupeById<T extends { id: string }>(rows: T[]) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
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

  let agreementsQuery = supabase
    .from("agreements")
    .select("*")
    .order("issued_at", { ascending: false });

  if (leadIds.length > 0) {
    agreementsQuery = agreementsQuery.or(
      `organization_id.eq.${id},lead_id.in.(${leadIds.join(",")})`,
    );
  } else {
    agreementsQuery = agreementsQuery.eq("organization_id", id);
  }

  let invoicesQuery = supabase
    .from("invoices")
    .select("*")
    .order("issued_at", { ascending: false });

  if (leadIds.length > 0) {
    invoicesQuery = invoicesQuery.or(
      `organization_id.eq.${id},lead_id.in.(${leadIds.join(",")})`,
    );
  } else {
    invoicesQuery = invoicesQuery.eq("organization_id", id);
  }

  const [
    { data: activitiesData, error: activitiesError },
    { data: purchasesData, error: purchasesError },
    { data: proposalsData, error: proposalsError },
    { data: agreementsData, error: agreementsError },
    { data: invoicesData, error: invoicesError },
  ] = await Promise.all([
    activitiesQuery,
    purchasesQuery,
    proposalsQuery,
    agreementsQuery,
    invoicesQuery,
  ]);

  if (activitiesError) {
    throw new Error(`Failed to load activities: ${activitiesError.message}`);
  }
  if (purchasesError) {
    throw new Error(`Failed to load purchases: ${purchasesError.message}`);
  }
  if (proposalsError) {
    throw new Error(`Failed to load proposals: ${proposalsError.message}`);
  }
  if (agreementsError) {
    throw new Error(`Failed to load agreements: ${agreementsError.message}`);
  }
  if (invoicesError) {
    throw new Error(`Failed to load invoices: ${invoicesError.message}`);
  }

  const organization = mapOrganizationToCrmRow(
    data as unknown as OrganizationRow,
  );

  return (
    <main>
      <OrganizationDetail
        activities={(activitiesData ?? []) as ActivityRow[]}
        agreements={dedupeById((agreementsData ?? []) as AgreementRow[])}
        invoices={dedupeById((invoicesData ?? []) as InvoiceRow[])}
        leads={leads}
        organization={organization}
        projects={projects}
        proposals={dedupeById((proposalsData ?? []) as ProposalWithItems[])}
        purchases={dedupeById(
          (purchasesData ?? []) as PurchaseWithRelations[],
        )}
      />
    </main>
  );
}
