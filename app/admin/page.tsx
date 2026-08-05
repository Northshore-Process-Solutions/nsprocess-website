import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { CrmPanel } from "@/components/admin/crm-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import {
  mapOrganizationToCrmRow,
  type OrganizationRow,
} from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
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
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load CRM data: ${error.message}`);
  }

  const organizations = (data ?? []) as unknown as OrganizationRow[];
  const rows = organizations.map(mapOrganizationToCrmRow);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="crm" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            CRM
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage businesses and contacts. Inquiries live in Pipeline;
            delivery work lives in Projects.
          </p>
        </div>
        <SignOutButton />
      </header>

      <CrmPanel rows={rows} />
    </main>
  );
}
