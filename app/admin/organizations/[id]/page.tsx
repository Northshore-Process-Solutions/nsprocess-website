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

  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", id)
    .order("created_at", { ascending: false });

  if (leadsError) {
    throw new Error(`Failed to load linked leads: ${leadsError.message}`);
  }

  const leads = (leadsData ?? []) as LeadRow[];
  const leadIds = leads.map((lead) => lead.id);

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

  const { data: activitiesData, error: activitiesError } = await activitiesQuery;

  if (activitiesError) {
    throw new Error(`Failed to load activities: ${activitiesError.message}`);
  }

  const organization = mapOrganizationToCrmRow(
    data as unknown as OrganizationRow,
  );
  const activities = (activitiesData ?? []) as ActivityRow[];

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
      />
    </main>
  );
}
