"use server";

import { revalidatePath } from "next/cache";

import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
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
  nextAction?: string;
  nextActionAt?: string;
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

  const nextActionAt = clean(input.nextActionAt);
  if (nextActionAt && !isDateOnly(nextActionAt)) {
    return { ok: false, error: "Next action date must be YYYY-MM-DD." };
  }

  return {
    name,
    status: input.status,
    priority: input.priority,
    startedAt: startedAt ?? undefined,
    targetEndAt: targetEndAt ?? undefined,
    nextAction: clean(input.nextAction) ?? undefined,
    nextActionAt: nextActionAt ?? undefined,
    scope: clean(input.scope) ?? undefined,
    notes: clean(input.notes) ?? undefined,
  };
}

function revalidateProject(id: string) {
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/pipeline");
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
      next_action: parsed.nextAction ?? null,
      next_action_at: parsed.nextActionAt ?? null,
      scope: parsed.scope ?? null,
      notes: parsed.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

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

  revalidateProject(projectId);
  return { ok: true };
}
