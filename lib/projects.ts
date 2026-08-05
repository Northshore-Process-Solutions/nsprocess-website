export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectRow = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  name: string;
  status: ProjectStatus;
  started_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectWithOrganization = ProjectRow & {
  organizations?: {
    id: string;
    name: string;
  } | null;
};

export const PROJECT_STATUSES: Array<{
  value: ProjectStatus;
  label: string;
}> = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function projectStatusLabel(status: ProjectStatus | string) {
  return (
    PROJECT_STATUSES.find((item) => item.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

export function defaultProjectName(businessName: string) {
  return `${businessName} — Process Improvement`;
}
