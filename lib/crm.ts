export type RelationshipType =
  | "vendor"
  | "customer"
  | "lead"
  | "partner"
  | "supplier";

export type OrganizationStatus =
  | "active"
  | "inactive"
  | "prospect"
  | "do_not_use";

export type OrganizationRow = {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: OrganizationStatus;
  notes: string | null;
  organization_relationships:
    | {
        id: string;
        relationship_type: RelationshipType;
        lifecycle_stage: string | null;
      }[]
    | null;
  organization_contacts:
    | {
        id: string;
        title: string | null;
        is_primary: boolean;
        contact_id: string;
        contacts:
          | {
              id: string;
              first_name: string | null;
              last_name: string | null;
              display_name: string | null;
              email: string | null;
              phone: string | null;
            }
          | {
              id: string;
              first_name: string | null;
              last_name: string | null;
              display_name: string | null;
              email: string | null;
              phone: string | null;
            }[]
          | null;
      }[]
    | null;
};

export type CrmTableRow = {
  id: string;
  name: string;
  relationshipType: RelationshipType | null;
  relationshipTypes: RelationshipType[];
  category: string | null;
  status: OrganizationStatus;
  primaryContact: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactTitle: string | null;
  contactId: string | null;
  email: string | null;
  phone: string | null;
  organizationEmail: string | null;
  organizationPhone: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  website: string | null;
  notes: string | null;
};

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  "vendor",
  "customer",
  "lead",
  "partner",
  "supplier",
];

/** UI labels — CRM "lead" means prospect, not a Pipeline Process Review lead. */
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  vendor: "Vendor",
  customer: "Customer",
  lead: "Prospect",
  partner: "Partner",
  supplier: "Supplier",
};

export function relationshipTypeLabel(type: RelationshipType | string) {
  return (
    RELATIONSHIP_TYPE_LABELS[type as RelationshipType] ??
    type.replaceAll("_", " ")
  );
}

export const ORGANIZATION_STATUSES: OrganizationStatus[] = [
  "active",
  "inactive",
  "prospect",
  "do_not_use",
];

function unwrapContact(
  contacts:
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
        email: string | null;
        phone: string | null;
      }
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
        email: string | null;
        phone: string | null;
      }[]
    | null
    | undefined,
) {
  if (!contacts) return null;
  return Array.isArray(contacts) ? (contacts[0] ?? null) : contacts;
}

export function mapOrganizationToCrmRow(org: OrganizationRow): CrmTableRow {
  const relationships = org.organization_relationships ?? [];
  const contacts = org.organization_contacts ?? [];
  const primary =
    contacts.find((contact) => contact.is_primary) ?? contacts[0] ?? null;
  const person = unwrapContact(primary?.contacts);
  const location = [org.city, org.state].filter(Boolean).join(", ") || null;

  return {
    id: org.id,
    name: org.name,
    relationshipType: relationships[0]?.relationship_type ?? null,
    relationshipTypes: relationships.map((item) => item.relationship_type),
    category: org.category,
    status: org.status,
    primaryContact: person?.display_name?.trim() || null,
    contactFirstName: person?.first_name ?? null,
    contactLastName: person?.last_name ?? null,
    contactTitle: primary?.title ?? null,
    contactId: person?.id ?? primary?.contact_id ?? null,
    email: person?.email || org.email,
    phone: person?.phone || org.phone,
    organizationEmail: org.email,
    organizationPhone: org.phone,
    city: org.city,
    state: org.state,
    location,
    website: org.website,
    notes: org.notes,
  };
}

export function emptyCrmFormValues() {
  return {
    name: "",
    relationshipType: "vendor" as RelationshipType,
    status: "active" as OrganizationStatus,
    category: "",
    website: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    notes: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    contactTitle: "",
  };
}

export function crmRowToFormValues(row: CrmTableRow) {
  return {
    name: row.name,
    relationshipType: row.relationshipType ?? ("vendor" as RelationshipType),
    status: row.status,
    category: row.category ?? "",
    website: row.website ?? "",
    email: row.organizationEmail ?? "",
    phone: row.organizationPhone ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    notes: row.notes ?? "",
    contactFirstName: row.contactFirstName ?? "",
    contactLastName: row.contactLastName ?? "",
    contactEmail: row.email ?? "",
    contactPhone: row.phone ?? "",
    contactTitle: row.contactTitle ?? "",
  };
}

export function matchesCrmSearch(row: CrmTableRow, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    row.name,
    row.email,
    row.phone,
    row.organizationEmail,
    row.organizationPhone,
    row.primaryContact,
    row.contactTitle,
    row.category,
    row.notes,
    row.location,
    row.website,
    ...row.relationshipTypes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}
