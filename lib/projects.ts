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
  next_action_source?: "task" | "event" | null;
};

export type ResolvedNextAction = {
  label: string | null;
  at: string | null;
  source: "task" | "event" | null;
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

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function dateOnlyRank(value: string) {
  return new Date(`${value}T12:00:00`).getTime();
}

function toDateKey(isoOrDate: string) {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Next action = soonest open task (by due date) or upcoming event (by start).
 * Undated open tasks only win when nothing dated is pending.
 */
export function resolveProjectNextAction(input: {
  tasks: Array<{
    title: string;
    is_done: boolean;
    due_at: string | null;
    sort_order?: number;
    created_at?: string;
  }>;
  events: Array<{
    title: string;
    starts_at: string;
    ends_at?: string | null;
  }>;
  now?: Date;
}): ResolvedNextAction {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();

  type Candidate = {
    label: string;
    at: string | null;
    source: "task" | "event";
    rank: number;
  };

  const candidates: Candidate[] = [];

  for (const task of input.tasks) {
    if (task.is_done) continue;
    const title = task.title.trim();
    if (!title) continue;

    if (task.due_at) {
      candidates.push({
        label: title,
        at: task.due_at,
        source: "task",
        rank: dateOnlyRank(task.due_at),
      });
    } else {
      candidates.push({
        label: title,
        at: null,
        source: "task",
        rank:
          Number.MAX_SAFE_INTEGER -
          1_000_000 +
          (task.sort_order ?? 0),
      });
    }
  }

  for (const event of input.events) {
    const endMs = event.ends_at
      ? new Date(event.ends_at).getTime()
      : new Date(event.starts_at).getTime();
    if (Number.isNaN(endMs) || endMs < nowMs) continue;

    const title = event.title.trim();
    if (!title) continue;

    const startMs = new Date(event.starts_at).getTime();
    if (Number.isNaN(startMs)) continue;

    candidates.push({
      label: title,
      at: toDateKey(event.starts_at),
      source: "event",
      rank: startMs,
    });
  }

  if (candidates.length === 0) {
    return { label: null, at: null, source: null };
  }

  candidates.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.label.localeCompare(b.label);
  });

  const next = candidates[0];
  return {
    label: next.label,
    at: next.at,
    source: next.source,
  };
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
  const todayKey = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
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
  const todayKey = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  return project.next_action_at < todayKey;
}
