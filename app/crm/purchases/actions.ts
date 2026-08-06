"use server";

import { revalidatePath } from "next/cache";

import {
  PURCHASE_TYPES,
  type PurchaseType,
} from "@/lib/purchases";
import { createClient } from "@/lib/supabase/server";

export type PurchaseInput = {
  name: string;
  purchaseType: PurchaseType;
  amount: string;
  purchasedAt: string;
  quantity?: string;
  organizationId?: string | null;
  projectId?: string | null;
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

function parseAmount(value?: string): { amount: number | null; error?: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { amount: null, error: "Amount is required." };
  }
  const amount = Number(trimmed);
  if (Number.isNaN(amount) || amount < 0) {
    return {
      amount: null,
      error: "Amount must be a valid non-negative number.",
    };
  }
  return { amount };
}

function parseQuantity(value?: string): {
  quantity: number | null;
  error?: string;
} {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { quantity: null };
  const quantity = Number(trimmed);
  if (Number.isNaN(quantity) || quantity < 0) {
    return {
      quantity: null,
      error: "Quantity must be a valid non-negative number.",
    };
  }
  return { quantity };
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

function parseInput(input: PurchaseInput): PurchaseInput | ActionResult {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Purchase name is required." };

  if (!PURCHASE_TYPES.some((item) => item.value === input.purchaseType)) {
    return { ok: false, error: "Invalid purchase type." };
  }

  const amount = parseAmount(input.amount);
  if (amount.error || amount.amount === null) {
    return { ok: false, error: amount.error ?? "Amount is required." };
  }

  const purchasedAt = clean(input.purchasedAt);
  if (!purchasedAt || !isDateOnly(purchasedAt)) {
    return { ok: false, error: "Purchase date must be YYYY-MM-DD." };
  }

  const quantity = parseQuantity(input.quantity);
  if (quantity.error) {
    return { ok: false, error: quantity.error };
  }

  return {
    name,
    purchaseType: input.purchaseType,
    amount: String(amount.amount),
    purchasedAt,
    quantity:
      quantity.quantity === null ? undefined : String(quantity.quantity),
    organizationId: clean(input.organizationId),
    projectId: clean(input.projectId),
    notes: clean(input.notes) ?? undefined,
  };
}

function revalidatePurchaseTargets(input: {
  organizationId?: string | null;
  projectId?: string | null;
}) {
  revalidatePath("/crm/purchases");
  revalidatePath("/crm/projects");
  revalidatePath("/crm");
  if (input.projectId) {
    revalidatePath(`/crm/projects/${input.projectId}`);
  }
  if (input.organizationId) {
    revalidatePath(`/crm/organizations/${input.organizationId}`);
  }
}

export async function createPurchase(
  input: PurchaseInput,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from("purchases").insert({
    name: parsed.name,
    purchase_type: parsed.purchaseType,
    amount: Number(parsed.amount),
    purchased_at: parsed.purchasedAt,
    quantity: parsed.quantity === undefined ? null : Number(parsed.quantity),
    organization_id: parsed.organizationId ?? null,
    project_id: parsed.projectId ?? null,
    notes: parsed.notes ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePurchaseTargets(parsed);
  return { ok: true };
}

export async function updatePurchase(
  id: string,
  input: PurchaseInput,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing purchase id." };

  const parsed = parseInput(input);
  if ("ok" in parsed) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("purchases")
    .select("organization_id, project_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("purchases")
    .update({
      name: parsed.name,
      purchase_type: parsed.purchaseType,
      amount: Number(parsed.amount),
      purchased_at: parsed.purchasedAt,
      quantity: parsed.quantity === undefined ? null : Number(parsed.quantity),
      organization_id: parsed.organizationId ?? null,
      project_id: parsed.projectId ?? null,
      notes: parsed.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePurchaseTargets(parsed);
  revalidatePurchaseTargets({
    organizationId: existing?.organization_id,
    projectId: existing?.project_id,
  });
  return { ok: true };
}

export async function deletePurchase(
  id: string,
  targets?: {
    organizationId?: string | null;
    projectId?: string | null;
  },
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing purchase id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from("purchases").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePurchaseTargets(targets ?? {});
  return { ok: true };
}
