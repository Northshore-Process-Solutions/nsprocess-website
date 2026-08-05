export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectPriority = "low" | "normal" | "high";

export type ProjectRow = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  started_at: string | null;
  target_end_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  scope: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectTaskRow = {
  id: string;
  project_id: string;
  title: string;
  is_done: boolean;
  due_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectWithOrganization = ProjectRow & {
  organizations?: {
    id: string;
    name: string;
  } | null;
  open_task_count?: number;
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

export const PROJECT_PRIORITIES: Array<{
  value: ProjectPriority;
  label: string;
}> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

export function projectStatusLabel(status: ProjectStatus | string) {
  return (
    PROJECT_STATUSES.find((item) => item.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

export function projectPriorityLabel(priority: ProjectPriority | string) {
  return (
    PROJECT_PRIORITIES.find((item) => item.value === priority)?.label ??
    priority
  );
}

export function defaultProjectName(businessName: string) {
  return `${businessName} — Process Improvement`;
}

export function isProjectPastTarget(project: {
  target_end_at: string | null;
  status: ProjectStatus;
}) {
  if (!project.target_end_at) return false;
  if (project.status === "completed" || project.status === "cancelled") {
    return false;
  }
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return project.target_end_at < todayKey;
}

export function isNextActionOverdue(project: {
  next_action_at: string | null;
  status: ProjectStatus;
}) {
  if (!project.next_action_at) return false;
  if (project.status === "completed" || project.status === "cancelled") {
    return false;
  }
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return project.next_action_at < todayKey;
}
