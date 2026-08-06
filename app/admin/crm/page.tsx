import { redirect } from "next/navigation";

import { CrmPanel } from "@/components/admin/crm-panel";
import {
  mapOrganizationToCrmRow,
  type OrganizationRow,
} from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export default async function CrmPage() {
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
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Businesses
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Company records and contacts. Inquiries live in Pipeline; delivery
          work lives in Projects.
        </p>
      </header>

      <CrmPanel rows={rows} />
    </main>
  );
}
