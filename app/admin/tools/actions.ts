"use server";

import { revalidatePath } from "next/cache";

import {
  BILLING_CADENCES,
  TOOL_STATUSES,
  type BillingCadence,
  type ToolStatus,
} from "@/lib/tools";
import { createClient } from "@/lib/supabase/server";

export type ToolInput = {
  name: string;
  category?: string;
  website?: string;
  adminUrl?: string;
  accountEmail?: string;
  plan?: string;
  billingAmount?: string;
  billingCadence: BillingCadence;
  renewalDate?: string;
  status: ToolStatus;
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

function parseBillingAmount(value?: string): {
  amount: number | null;
  error?: string;
} {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { amount: null };

  const amount = Number(trimmed);
  if (Number.isNaN(amount) || amount < 0) {
    return {
      amount: null,
      error: "Billing amount must be a valid non-negative number.",
    };
  }

  return { amount };
}

function parseInput(input: ToolInput): ToolInput | ActionResult {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Tool name is required." };
  }

  if (!TOOL_STATUSES.includes(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  if (!BILLING_CADENCES.includes(input.billingCadence)) {
    return { ok: false, error: "Invalid billing cadence." };
  }

  const billing = parseBillingAmount(input.billingAmount);
  if (billing.error) {
    return { ok: false, error: billing.error };
  }

  return {
    name,
    category: clean(input.category) ?? undefined,
    website: clean(input.website) ?? undefined,
    adminUrl: clean(input.adminUrl) ?? undefined,
    accountEmail: clean(input.accountEmail) ?? undefined,
    plan: clean(input.plan) ?? undefined,
    billingAmount:
      billing.amount === null ? undefined : String(billing.amount),
    billingCadence: input.billingCadence,
    renewalDate: clean(input.renewalDate) ?? undefined,
    status: input.status,
    notes: clean(input.notes) ?? undefined,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

function toDbPayload(input: ToolInput) {
  return {
    name: input.name,
    category: input.category ?? null,
    website: input.website ?? null,
    admin_url: input.adminUrl ?? null,
    account_email: input.accountEmail ?? null,
    plan: input.plan ?? null,
    billing_amount:
      input.billingAmount === undefined || input.billingAmount === ""
        ? null
        : Number(input.billingAmount),
    billing_cadence: input.billingCadence,
    renewal_date: input.renewalDate ?? null,
    status: input.status,
    notes: input.notes ?? null,
  };
}

export async function createTool(input: ToolInput): Promise<ActionResult> {
  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase.from("tools").insert(toDbPayload(parsed));

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/tools");
  return { ok: true };
}

export async function updateTool(
  toolId: string,
  input: ToolInput,
): Promise<ActionResult> {
  if (!toolId) {
    return { ok: false, error: "Missing tool id." };
  }

  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("tools")
    .update({
      ...toDbPayload(parsed),
      updated_at: new Date().toISOString(),
    })
    .eq("id", toolId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/tools");
  return { ok: true };
}

export async function deleteTool(toolId: string): Promise<ActionResult> {
  if (!toolId) {
    return { ok: false, error: "Missing tool id." };
  }

  const { supabase, error: authError } = await requireUser();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase.from("tools").delete().eq("id", toolId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/tools");
  return { ok: true };
}
