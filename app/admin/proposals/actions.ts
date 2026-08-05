"use server";

import { revalidatePath } from "next/cache";

import {
  PROPOSAL_STATUSES,
  computeLineTotal,
  computeProposalTotals,
  type ProposalItemInput,
  type ProposalStatus,
} from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";

export type ProposalInput = {
  title: string;
  status: ProposalStatus;
  leadId?: string | null;
  organizationId?: string | null;
  clientBusinessName: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
  issuedAt: string;
  validUntil?: string;
  scopeSummary?: string;
  terms?: string;
  notes?: string;
  depositPercent?: string;
  items: ProposalItemInput[];
};

export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
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

function parseItems(items: ProposalItemInput[]) {
  if (!items.length) {
    return { error: "Add at least one line item." as const };
  }

  const parsed: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  for (const [index, item] of items.entries()) {
    const description = item.description.trim();
    if (!description) {
      return { error: `Line ${index + 1}: description is required.` as const };
    }

    const quantity = Number(item.quantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      return { error: `Line ${index + 1}: quantity must be valid.` as const };
    }

    const unitPrice = Number(item.unitPrice);
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      return { error: `Line ${index + 1}: unit price must be valid.` as const };
    }

    parsed.push({
      description,
      quantity,
      unitPrice,
      lineTotal: computeLineTotal(quantity, unitPrice),
    });
  }

  return { items: parsed };
}

function parseInput(input: ProposalInput): {
  ok: true;
  value: {
    title: string;
    status: ProposalStatus;
    leadId: string | null;
    organizationId: string | null;
    clientBusinessName: string;
    clientContactName: string | null;
    clientEmail: string | null;
    clientPhone: string | null;
    issuedAt: string;
    validUntil: string | null;
    scopeSummary: string | null;
    terms: string | null;
    notes: string | null;
    depositPercent: number | null;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    totalAmount: number;
  };
} | ActionResult {
  const title = input.title.trim();
  const clientBusinessName = input.clientBusinessName.trim();

  if (!title) return { ok: false, error: "Title is required." };
  if (!clientBusinessName) {
    return { ok: false, error: "Client business name is required." };
  }
  if (!PROPOSAL_STATUSES.some((item) => item.value === input.status)) {
    return { ok: false, error: "Invalid status." };
  }
  if (!isDateOnly(input.issuedAt)) {
    return { ok: false, error: "Issue date must be YYYY-MM-DD." };
  }

  const validUntil = clean(input.validUntil);
  if (validUntil && !isDateOnly(validUntil)) {
    return { ok: false, error: "Valid-until must be YYYY-MM-DD." };
  }

  let depositPercent: number | null = null;
  const depositRaw = clean(input.depositPercent);
  if (depositRaw) {
    const value = Number(depositRaw);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return { ok: false, error: "Deposit percent must be between 0 and 100." };
    }
    depositPercent = value;
  }

  const itemsResult = parseItems(input.items);
  if ("error" in itemsResult) {
    return { ok: false, error: itemsResult.error };
  }

  const totals = computeProposalTotals(
    itemsResult.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    depositPercent,
  );

  return {
    ok: true,
    value: {
      title,
      status: input.status,
      leadId: clean(input.leadId),
      organizationId: clean(input.organizationId),
      clientBusinessName,
      clientContactName: clean(input.clientContactName),
      clientEmail: clean(input.clientEmail)?.toLowerCase() ?? null,
      clientPhone: clean(input.clientPhone),
      issuedAt: input.issuedAt,
      validUntil,
      scopeSummary: clean(input.scopeSummary),
      terms: clean(input.terms),
      notes: clean(input.notes),
      depositPercent,
      items: itemsResult.items,
      subtotal: totals.subtotal,
      totalAmount: totals.total,
    },
  };
}

async function nextProposalNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;

  const { data } = await supabase
    .from("proposals")
    .select("proposal_number")
    .like("proposal_number", `${prefix}%`)
    .order("proposal_number", { ascending: false })
    .limit(20);

  let max = 0;
  for (const row of data ?? []) {
    const suffix = String(row.proposal_number).replace(prefix, "");
    const num = Number(suffix);
    if (!Number.isNaN(num) && num > max) max = num;
  }

  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

function revalidateProposalTargets(input: {
  id?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
}) {
  revalidatePath("/admin/proposals");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
  if (input.id) {
    revalidatePath(`/admin/proposals/${input.id}`);
    revalidatePath(`/admin/proposals/${input.id}/pdf`);
  }
  if (input.organizationId) {
    revalidatePath(`/admin/organizations/${input.organizationId}`);
  }
}

async function syncLeadOnStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string | null,
  status: ProposalStatus,
) {
  if (!leadId) return;

  if (status === "sent") {
    const { data: lead } = await supabase
      .from("leads")
      .select("stage")
      .eq("id", leadId)
      .maybeSingle();

    if (
      lead &&
      !["proposal_sent", "deposit_received", "won", "lost"].includes(lead.stage)
    ) {
      await supabase
        .from("leads")
        .update({
          stage: "proposal_sent",
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);
    }
  }
}

async function replaceItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  proposalId: string,
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>,
) {
  const { error: deleteError } = await supabase
    .from("proposal_items")
    .delete()
    .eq("proposal_id", proposalId);

  if (deleteError) return deleteError.message;

  const { error: insertError } = await supabase.from("proposal_items").insert(
    items.map((item, index) => ({
      proposal_id: proposalId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      sort_order: index,
    })),
  );

  return insertError?.message ?? null;
}

export async function createProposal(
  input: ProposalInput,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if (!("value" in parsed)) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const proposalNumber = await nextProposalNumber(auth.supabase);
  const now = new Date().toISOString();
  const value = parsed.value;

  const { data, error } = await auth.supabase
    .from("proposals")
    .insert({
      proposal_number: proposalNumber,
      title: value.title,
      status: value.status,
      lead_id: value.leadId,
      organization_id: value.organizationId,
      client_business_name: value.clientBusinessName,
      client_contact_name: value.clientContactName,
      client_email: value.clientEmail,
      client_phone: value.clientPhone,
      issued_at: value.issuedAt,
      valid_until: value.validUntil,
      scope_summary: value.scopeSummary,
      terms: value.terms,
      notes: value.notes,
      deposit_percent: value.depositPercent,
      subtotal: value.subtotal,
      total_amount: value.totalAmount,
      sent_at: value.status === "sent" ? now : null,
      accepted_at: value.status === "accepted" ? now : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create proposal." };
  }

  const itemsError = await replaceItems(auth.supabase, data.id, value.items);
  if (itemsError) return { ok: false, error: itemsError };

  await syncLeadOnStatus(auth.supabase, value.leadId, value.status);
  revalidateProposalTargets({
    id: data.id,
    leadId: value.leadId,
    organizationId: value.organizationId,
  });
  return { ok: true, id: data.id };
}

export async function updateProposal(
  id: string,
  input: ProposalInput,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing proposal id." };

  const parsed = parseInput(input);
  if (!("value" in parsed)) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("proposals")
    .select("id, status, sent_at, accepted_at, organization_id, lead_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Proposal not found." };

  const value = parsed.value;
  const now = new Date().toISOString();

  const { error } = await auth.supabase
    .from("proposals")
    .update({
      title: value.title,
      status: value.status,
      lead_id: value.leadId,
      organization_id: value.organizationId,
      client_business_name: value.clientBusinessName,
      client_contact_name: value.clientContactName,
      client_email: value.clientEmail,
      client_phone: value.clientPhone,
      issued_at: value.issuedAt,
      valid_until: value.validUntil,
      scope_summary: value.scopeSummary,
      terms: value.terms,
      notes: value.notes,
      deposit_percent: value.depositPercent,
      subtotal: value.subtotal,
      total_amount: value.totalAmount,
      sent_at:
        value.status === "sent"
          ? existing.sent_at ?? now
          : existing.sent_at,
      accepted_at:
        value.status === "accepted"
          ? existing.accepted_at ?? now
          : existing.accepted_at,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  const itemsError = await replaceItems(auth.supabase, id, value.items);
  if (itemsError) return { ok: false, error: itemsError };

  await syncLeadOnStatus(auth.supabase, value.leadId, value.status);
  revalidateProposalTargets({
    id,
    leadId: value.leadId ?? existing.lead_id,
    organizationId: value.organizationId ?? existing.organization_id,
  });
  return { ok: true, id };
}

export async function deleteProposal(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing proposal id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("proposals")
    .select("lead_id, organization_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await auth.supabase.from("proposals").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateProposalTargets({
    leadId: existing?.lead_id,
    organizationId: existing?.organization_id,
  });
  return { ok: true };
}

export async function markProposalSent(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing proposal id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("proposals")
    .select("lead_id, organization_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Proposal not found." };

  const now = new Date().toISOString();
  const { error } = await auth.supabase
    .from("proposals")
    .update({
      status: "sent",
      sent_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await syncLeadOnStatus(auth.supabase, existing.lead_id, "sent");
  revalidateProposalTargets({
    id,
    leadId: existing.lead_id,
    organizationId: existing.organization_id,
  });
  return { ok: true, id };
}
