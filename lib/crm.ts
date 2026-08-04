export type RelationshipType =
  | "vendor"
  | "customer"
  | "lead"
  | "partner"
  | "supplier";

export type OrganizationRow = {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string;
  notes: string | null;
  organization_relationships:
    | {
        relationship_type: RelationshipType;
        lifecycle_stage: string | null;
      }[]
    | null;
  organization_contacts:
    | {
        title: string | null;
        is_primary: boolean;
        contacts:
          | {
              display_name: string | null;
              email: string | null;
              phone: string | null;
            }
          | {
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
  relationshipTypes: RelationshipType[];
  category: string | null;
  status: string;
  primaryContact: string | null;
  contactTitle: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  notes: string | null;
};

function unwrapContact(
  contacts:
    | {
        display_name: string | null;
        email: string | null;
        phone: string | null;
      }
    | {
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
    relationshipTypes: relationships.map((item) => item.relationship_type),
    category: org.category,
    status: org.status,
    primaryContact: person?.display_name?.trim() || null,
    contactTitle: primary?.title ?? null,
    email: person?.email || org.email,
    phone: person?.phone || org.phone,
    location,
    website: org.website,
    notes: org.notes,
  };
}
