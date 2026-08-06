"use server";

import { revalidatePath } from "next/cache";

import {
  AGREEMENT_STATUSES,
  type AgreementStatus,
} from "@/lib/agreements";
import {
  computeTotals,
  isDateOnly,
  nextDocumentNumber,
  parseLineItems,
  type LineItemInput,
} from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export type AgreementInput = {
  title: string;
  status: AgreementStatus;
  proposalId?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
  clientBusinessName: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
  issuedAt: string;
  scopeSummary?: string;
  terms?: string;
  notes?: string;
  depositPercent?: string;
  signerName?: string;
  items: LineItemInput[];
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

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }

  return { supabase, error: null };
}

function parseInput(input: AgreementInput): {
  ok: true;
  value: {
    title: string;
    status: AgreementStatus;
    proposalId: string | null;
    leadId: string | null;
    organizationId: string | null;
    clientBusinessName: string;
    clientContactName: string | null;
    clientEmail: string | null;
    clientPhone: string | null;
    issuedAt: string;
    scopeSummary: string | null;
    terms: string | null;
    notes: string | null;
    depositPercent: number | null;
    signerName: string | null;
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
  if (!AGREEMENT_STATUSES.some((item) => item.value === input.status)) {
    return { ok: false, error: "Invalid status." };
  }
  if (!isDateOnly(input.issuedAt)) {
    return { ok: false, error: "Issue date must be YYYY-MM-DD." };
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

  const itemsResult = parseLineItems(input.items);
  if ("error" in itemsResult) {
    return { ok: false, error: itemsResult.error };
  }

  const totals = computeTotals(
    itemsResult.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  );

  return {
    ok: true,
    value: {
      title,
      status: input.status,
      proposalId: clean(input.proposalId),
      leadId: clean(input.leadId),
      organizationId: clean(input.organizationId),
      clientBusinessName,
      clientContactName: clean(input.clientContactName),
      clientEmail: clean(input.clientEmail)?.toLowerCase() ?? null,
      clientPhone: clean(input.clientPhone),
      issuedAt: input.issuedAt,
      scopeSummary: clean(input.scopeSummary),
      terms: clean(input.terms),
      notes: clean(input.notes),
      depositPercent,
      signerName: clean(input.signerName),
      items: itemsResult.items,
      subtotal: totals.subtotal,
      totalAmount: totals.total,
    },
  };
}

function revalidateAgreementTargets(input: {
  id?: string | null;
  proposalId?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
}) {
  revalidatePath("/crm/agreements");
  revalidatePath("/crm/billing");
  revalidatePath("/crm/proposals");
  revalidatePath("/crm");
  if (input.id) {
    revalidatePath(`/crm/agreements/${input.id}`);
    revalidatePath(`/crm/agreements/${input.id}/pdf`);
  }
  if (input.proposalId) {
    revalidatePath(`/crm/proposals/${input.proposalId}`);
    revalidatePath(`/crm/proposals/${input.proposalId}/pdf`);
  }
  if (input.organizationId) {
    revalidatePath(`/crm/organizations/${input.organizationId}`);
  }
}

async function replaceItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agreementId: string,
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>,
) {
  const { error: deleteError } = await supabase
    .from("agreement_items")
    .delete()
    .eq("agreement_id", agreementId);

  if (deleteError) return deleteError.message;

  const { error: insertError } = await supabase.from("agreement_items").insert(
    items.map((item, index) => ({
      agreement_id: agreementId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      sort_order: index,
    })),
  );

  return insertError?.message ?? null;
}

async function syncProposalOnSigned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  proposalId: string | null,
) {
  if (!proposalId) return;

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, accepted_at")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal) return;

  const now = new Date().toISOString();
  await supabase
    .from("proposals")
    .update({
      status: "accepted",
      accepted_at: proposal.accepted_at ?? now,
      updated_at: now,
    })
    .eq("id", proposalId);
}

export async function createAgreement(
  input: AgreementInput,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if (!("value" in parsed)) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const agreementNumber = await nextDocumentNumber(
    auth.supabase,
    "agreements",
    "agreement_number",
    "AGR",
  );
  const now = new Date().toISOString();
  const value = parsed.value;
  const isSigned = value.status === "signed";

  const { data, error } = await auth.supabase
    .from("agreements")
    .insert({
      agreement_number: agreementNumber,
      title: value.title,
      status: value.status,
      proposal_id: value.proposalId,
      lead_id: value.leadId,
      organization_id: value.organizationId,
      client_business_name: value.clientBusinessName,
      client_contact_name: value.clientContactName,
      client_email: value.clientEmail,
      client_phone: value.clientPhone,
      issued_at: value.issuedAt,
      scope_summary: value.scopeSummary,
      terms: value.terms,
      notes: value.notes,
      deposit_percent: value.depositPercent,
      subtotal: value.subtotal,
      total_amount: value.totalAmount,
      signer_name: isSigned ? value.signerName : null,
      signed_at: isSigned ? now : null,
      sent_at: value.status === "sent" ? now : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create agreement." };
  }

  const itemsError = await replaceItems(auth.supabase, data.id, value.items);
  if (itemsError) return { ok: false, error: itemsError };

  if (isSigned) {
    await syncProposalOnSigned(auth.supabase, value.proposalId);
  }

  revalidateAgreementTargets({
    id: data.id,
    proposalId: value.proposalId,
    leadId: value.leadId,
    organizationId: value.organizationId,
  });
  return { ok: true, id: data.id };
}

export async function updateAgreement(
  id: string,
  input: AgreementInput,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing agreement id." };

  const parsed = parseInput(input);
  if (!("value" in parsed)) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("agreements")
    .select(
      "id, status, sent_at, signed_at, signer_name, proposal_id, organization_id, lead_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Agreement not found." };

  const value = parsed.value;
  const now = new Date().toISOString();
  const isSigned = value.status === "signed";

  const { error } = await auth.supabase
    .from("agreements")
    .update({
      title: value.title,
      status: value.status,
      proposal_id: value.proposalId,
      lead_id: value.leadId,
      organization_id: value.organizationId,
      client_business_name: value.clientBusinessName,
      client_contact_name: value.clientContactName,
      client_email: value.clientEmail,
      client_phone: value.clientPhone,
      issued_at: value.issuedAt,
      scope_summary: value.scopeSummary,
      terms: value.terms,
      notes: value.notes,
      deposit_percent: value.depositPercent,
      subtotal: value.subtotal,
      total_amount: value.totalAmount,
      sent_at:
        value.status === "sent" ? existing.sent_at ?? now : existing.sent_at,
      signer_name: isSigned
        ? value.signerName ?? existing.signer_name
        : existing.signer_name,
      signed_at: isSigned ? existing.signed_at ?? now : existing.signed_at,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  const itemsError = await replaceItems(auth.supabase, id, value.items);
  if (itemsError) return { ok: false, error: itemsError };

  if (isSigned) {
    await syncProposalOnSigned(
      auth.supabase,
      value.proposalId ?? existing.proposal_id,
    );
  }

  revalidateAgreementTargets({
    id,
    proposalId: value.proposalId ?? existing.proposal_id,
    leadId: value.leadId ?? existing.lead_id,
    organizationId: value.organizationId ?? existing.organization_id,
  });
  return { ok: true, id };
}

export async function deleteAgreement(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing agreement id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("agreements")
    .select("proposal_id, lead_id, organization_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await auth.supabase.from("agreements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAgreementTargets({
    proposalId: existing?.proposal_id,
    leadId: existing?.lead_id,
    organizationId: existing?.organization_id,
  });
  return { ok: true };
}

export async function markAgreementSigned(
  id: string,
  signerName: string,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing agreement id." };

  const name = signerName.trim();
  if (!name) return { ok: false, error: "Signer name is required." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("agreements")
    .select("proposal_id, organization_id, lead_id, signed_at")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Agreement not found." };

  const now = new Date().toISOString();
  const { error } = await auth.supabase
    .from("agreements")
    .update({
      status: "signed",
      signer_name: name,
      signed_at: existing.signed_at ?? now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await syncProposalOnSigned(auth.supabase, existing.proposal_id);

  revalidateAgreementTargets({
    id,
    proposalId: existing.proposal_id,
    leadId: existing.lead_id,
    organizationId: existing.organization_id,
  });
  return { ok: true, id };
}

export async function createAgreementFromProposal(
  proposalId: string,
): Promise<ActionResult> {
  if (!proposalId) return { ok: false, error: "Missing proposal id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: proposal, error: proposalError } = await auth.supabase
    .from("proposals")
    .select(
      `
      *,
      proposal_items (
        id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order
      )
    `,
    )
    .eq("id", proposalId)
    .maybeSingle();

  if (proposalError) {
    return { ok: false, error: proposalError.message };
  }
  if (!proposal) return { ok: false, error: "Proposal not found." };

  const items = [...(proposal.proposal_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const agreementNumber = await nextDocumentNumber(
    auth.supabase,
    "agreements",
    "agreement_number",
    "AGR",
  );
  const now = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from("agreements")
    .insert({
      agreement_number: agreementNumber,
      title: "Process Improvement Agreement",
      status: "draft",
      proposal_id: proposalId,
      lead_id: proposal.lead_id,
      organization_id: proposal.organization_id,
      client_business_name: proposal.client_business_name,
      client_contact_name: proposal.client_contact_name,
      client_email: proposal.client_email,
      client_phone: proposal.client_phone,
      issued_at: proposal.issued_at,
      scope_summary: proposal.scope_summary,
      terms: proposal.terms,
      notes: proposal.notes,
      deposit_percent: proposal.deposit_percent,
      subtotal: proposal.subtotal,
      total_amount: proposal.total_amount,
      sent_at: null,
      signed_at: null,
      signer_name: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create agreement from proposal.",
    };
  }

  const itemsError = await replaceItems(
    auth.supabase,
    data.id,
    items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    })),
  );

  if (itemsError) return { ok: false, error: itemsError };

  revalidateAgreementTargets({
    id: data.id,
    proposalId,
    leadId: proposal.lead_id,
    organizationId: proposal.organization_id,
  });
  return { ok: true, id: data.id };
}
