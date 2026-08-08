"use server";

import { revalidatePath } from "next/cache";

import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  resolveProjectNextAction,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export type ProjectInput = {
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startedAt?: string;
  targetEndAt?: string;
  scope?: string;
  notes?: string;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
};

function clean(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

function parseInput(input: ProjectInput): ProjectInput | ActionResult {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Project name is required." };
  }

  if (!PROJECT_STATUSES.some((item) => item.value === input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  if (!PROJECT_PRIORITIES.some((item) => item.value === input.priority)) {
    return { ok: false, error: "Invalid priority." };
  }

  const startedAt = clean(input.startedAt);
  if (startedAt && !isDateOnly(startedAt)) {
    return { ok: false, error: "Start date must be YYYY-MM-DD." };
  }

  const targetEndAt = clean(input.targetEndAt);
  if (targetEndAt && !isDateOnly(targetEndAt)) {
    return { ok: false, error: "Target end date must be YYYY-MM-DD." };
  }

  return {
    name,
    status: input.status,
    priority: input.priority,
    startedAt: startedAt ?? undefined,
    targetEndAt: targetEndAt ?? undefined,
    scope: clean(input.scope) ?? undefined,
    notes: clean(input.notes) ?? undefined,
  };
}

function revalidateProject(id: string) {
  revalidatePath("/crm/projects");
  revalidatePath(`/crm/projects/${id}`);
  revalidatePath("/crm");
  revalidatePath("/crm/pipeline");
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** Recalculate next_action from open tasks + upcoming events. */
export async function syncProjectNextAction(
  supabase: SupabaseClient,
  projectId: string,
) {
  if (!projectId) return;

  const nowIso = new Date().toISOString();

  const [
    { data: tasks },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("project_tasks")
      .select("title, is_done, due_at, sort_order, created_at")
      .eq("project_id", projectId)
      .eq("is_done", false),
    supabase
      .from("calendar_events")
      .select("title, starts_at, ends_at")
      .eq("project_id", projectId)
      .gte("starts_at", nowIso),
  ]);

  const next = resolveProjectNextAction({
    tasks: tasks ?? [],
    events: events ?? [],
  });

  await supabase
    .from("projects")
    .update({
      next_action: next.label,
      next_action_at: next.at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
}

/** Sync every project tied to this event's project and/or lead. */
export async function syncNextActionForEventTargets(
  supabase: SupabaseClient,
  targets: {
    projectId?: string | null;
    leadId?: string | null;
  },
) {
  const projectIds = new Set<string>();
  const projectId = clean(targets.projectId);
  const leadId = clean(targets.leadId);

  if (projectId) projectIds.add(projectId);

  if (leadId) {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("lead_id", leadId);
    for (const row of data ?? []) {
      projectIds.add(row.id as string);
    }
  }

  for (const id of projectIds) {
    await syncProjectNextAction(supabase, id);
    revalidateProject(id);
  }
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { error } = await auth.supabase
    .from("projects")
    .update({
      name: parsed.name,
      status: parsed.status,
      priority: parsed.priority,
      started_at: parsed.startedAt ?? null,
      target_end_at: parsed.targetEndAt ?? null,
      scope: parsed.scope ?? null,
      notes: parsed.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await syncProjectNextAction(auth.supabase, id);
  revalidateProject(id);
  return { ok: true };
}

export async function createProjectTask(
  projectId: string,
  input: { title: string; dueAt?: string },
): Promise<ActionResult> {
  if (!projectId) return { ok: false, error: "Missing project id." };

  const title = clean(input.title);
  if (!title) return { ok: false, error: "Task title is required." };

  const dueAt = clean(input.dueAt);
  if (dueAt && !isDateOnly(dueAt)) {
    return { ok: false, error: "Due date must be YYYY-MM-DD." };
  }

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { count } = await auth.supabase
    .from("project_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { error } = await auth.supabase.from("project_tasks").insert({
    project_id: projectId,
    title,
    due_at: dueAt ?? null,
    sort_order: count ?? 0,
  });

  if (error) return { ok: false, error: error.message };

  await syncProjectNextAction(auth.supabase, projectId);
  revalidateProject(projectId);
  return { ok: true };
}

export async function toggleProjectTask(
  taskId: string,
  projectId: string,
  isDone: boolean,
): Promise<ActionResult> {
  if (!taskId || !projectId) {
    return { ok: false, error: "Missing task id." };
  }

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("project_tasks")
    .update({
      is_done: isDone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  await syncProjectNextAction(auth.supabase, projectId);
  revalidateProject(projectId);
  return { ok: true };
}

export async function deleteProjectTask(
  taskId: string,
  projectId: string,
): Promise<ActionResult> {
  if (!taskId || !projectId) {
    return { ok: false, error: "Missing task id." };
  }

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("project_tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  await syncProjectNextAction(auth.supabase, projectId);
  revalidateProject(projectId);
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing project id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("projects")
    .select("id, organization_id, lead_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Project not found." };

  const { error } = await auth.supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/crm/projects");
  revalidatePath("/crm");
  revalidatePath("/crm/pipeline");
  if (existing.organization_id) {
    revalidatePath(`/crm/organizations/${existing.organization_id}`);
  }

  return { ok: true };
}
