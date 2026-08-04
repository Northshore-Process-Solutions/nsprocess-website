import { Building2, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { CrmPanel } from "@/components/admin/crm-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import {
  mapOrganizationToCrmRow,
  type OrganizationRow,
  type RelationshipType,
} from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

type AdminPageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

const filters: Array<{ label: string; value: string }> = [
  { label: "All", value: "all" },
  { label: "Vendors", value: "vendor" },
  { label: "Customers", value: "customer" },
  { label: "Leads", value: "lead" },
  { label: "Partners", value: "partner" },
  { label: "Suppliers", value: "supplier" },
];

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const typeFilter = params?.type ?? "all";

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

  const rows = organizations
    .map(mapOrganizationToCrmRow)
    .filter((row) =>
      typeFilter === "all"
        ? true
        : row.relationshipTypes.includes(typeFilter as RelationshipType),
    );

  const vendorCount = organizations.filter((org) =>
    (org.organization_relationships ?? []).some(
      (relationship) => relationship.relationship_type === "vendor",
    ),
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            CRM
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage organizations, relationship types, and primary contacts.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Building2 aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Organizations</p>
              <p className="text-2xl font-bold">{organizations.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Users aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Vendors</p>
              <p className="text-2xl font-bold">{vendorCount}</p>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="CRM filters" className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = typeFilter === filter.value;
          const href =
            filter.value === "all" ? "/admin" : `/admin?type=${filter.value}`;

          return (
            <a
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={href}
              key={filter.value}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      <CrmPanel rows={rows} />
    </main>
  );
}
