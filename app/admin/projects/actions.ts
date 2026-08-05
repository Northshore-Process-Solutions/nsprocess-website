"use server";

import { revalidatePath } from "next/cache";

import {
  PROJECT_STATUSES,
  type ProjectStatus,
} from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export type ProjectInput = {
  name: string;
  status: ProjectStatus;
  startedAt?: string;
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

  const startedAt = clean(input.startedAt);
  if (startedAt && !/^\d{4}-\d{2}-\d{2}$/.test(startedAt)) {
    return { ok: false, error: "Start date must be YYYY-MM-DD." };
  }

  return {
    name,
    status: input.status,
    startedAt: startedAt ?? undefined,
    notes: clean(input.notes) ?? undefined,
  };
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
      started_at: parsed.startedAt ?? null,
      notes: parsed.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/pipeline");
  return { ok: true };
}
