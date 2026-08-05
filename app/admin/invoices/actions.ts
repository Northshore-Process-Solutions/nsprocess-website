"use server";

import { revalidatePath } from "next/cache";

import type { AgreementWithItems } from "@/lib/agreements";
import {
  addDaysDateOnly,
  computeTotals,
  isDateOnly,
  nextDocumentNumber,
  parseLineItems,
  todayDateOnly,
  type LineItemInput,
} from "@/lib/billing";
import {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  type InvoiceStatus,
  type InvoiceType,
} from "@/lib/invoices";
import { createClient } from "@/lib/supabase/server";

export type InvoiceInput = {
  title: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  agreementId?: string | null;
  proposalId?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  clientBusinessName: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
  issuedAt: string;
  dueAt?: string;
  notes?: string;
  amountPaid?: string;
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

function parseInput(input: InvoiceInput): {
  ok: true;
  value: {
    title: string;
    invoiceType: InvoiceType;
    status: InvoiceStatus;
    agreementId: string | null;
    proposalId: string | null;
    leadId: string | null;
    organizationId: string | null;
    projectId: string | null;
    clientBusinessName: string;
    clientContactName: string | null;
    clientEmail: string | null;
    clientPhone: string | null;
    issuedAt: string;
    dueAt: string | null;
    notes: string | null;
    amountPaid: number;
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
  if (!INVOICE_TYPES.some((item) => item.value === input.invoiceType)) {
    return { ok: false, error: "Invalid invoice type." };
  }
  if (!INVOICE_STATUSES.some((item) => item.value === input.status)) {
    return { ok: false, error: "Invalid status." };
  }
  if (!isDateOnly(input.issuedAt)) {
    return { ok: false, error: "Issue date must be YYYY-MM-DD." };
  }

  const dueAt = clean(input.dueAt);
  if (dueAt && !isDateOnly(dueAt)) {
    return { ok: false, error: "Due date must be YYYY-MM-DD." };
  }

  const amountPaidRaw = clean(input.amountPaid) ?? "0";
  const amountPaid = Number(amountPaidRaw);
  if (Number.isNaN(amountPaid) || amountPaid < 0) {
    return { ok: false, error: "Amount paid must be a valid number." };
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

  if (amountPaid > totals.total) {
    return { ok: false, error: "Amount paid cannot exceed total." };
  }

  return {
    ok: true,
    value: {
      title,
      invoiceType: input.invoiceType,
      status: input.status,
      agreementId: clean(input.agreementId),
      proposalId: clean(input.proposalId),
      leadId: clean(input.leadId),
      organizationId: clean(input.organizationId),
      projectId: clean(input.projectId),
      clientBusinessName,
      clientContactName: clean(input.clientContactName),
      clientEmail: clean(input.clientEmail)?.toLowerCase() ?? null,
      clientPhone: clean(input.clientPhone),
      issuedAt: input.issuedAt,
      dueAt,
      notes: clean(input.notes),
      amountPaid,
      items: itemsResult.items,
      subtotal: totals.subtotal,
      totalAmount: totals.total,
    },
  };
}

function revalidateInvoiceTargets(input: {
  id?: string | null;
  leadId?: string | null;
  organizationId?: string | null;
  agreementId?: string | null;
}) {
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/statements");
  revalidatePath("/admin/agreements");
  revalidatePath("/admin");
  if (input.id) {
    revalidatePath(`/admin/invoices/${input.id}`);
    revalidatePath(`/admin/invoices/${input.id}/pdf`);
  }
  if (input.organizationId) {
    revalidatePath(`/admin/organizations/${input.organizationId}`);
  }
  if (input.agreementId) {
    revalidatePath(`/admin/agreements/${input.agreementId}`);
  }
}

async function replaceItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>,
) {
  const { error: deleteError } = await supabase
    .from("invoice_items")
    .delete()
    .eq("invoice_id", invoiceId);

  if (deleteError) return deleteError.message;

  const { error: insertError } = await supabase.from("invoice_items").insert(
    items.map((item, index) => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      sort_order: index,
    })),
  );

  return insertError?.message ?? null;
}

async function loadAgreement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agreementId: string,
): Promise<{ agreement: AgreementWithItems } | ActionResult> {
  const { data, error } = await supabase
    .from("agreements")
    .select(
      `
      *,
      agreement_items (
        id,
        agreement_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      )
    `,
    )
    .eq("id", agreementId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Agreement not found." };

  return { agreement: data as AgreementWithItems };
}

async function syncLeadOnDepositPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string | null,
) {
  if (!leadId) return;

  const { data: lead } = await supabase
    .from("leads")
    .select("stage")
    .eq("id", leadId)
    .maybeSingle();

  if (
    lead &&
    !["deposit_received", "won", "lost"].includes(lead.stage)
  ) {
    await supabase
      .from("leads")
      .update({
        stage: "deposit_received",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);
  }
}

export async function createInvoice(
  input: InvoiceInput,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if (!("value" in parsed)) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const invoiceNumber = await nextDocumentNumber(
    auth.supabase,
    "invoices",
    "invoice_number",
    "INV",
  );
  const now = new Date().toISOString();
  const value = parsed.value;

  const { data, error } = await auth.supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      title: value.title,
      invoice_type: value.invoiceType,
      status: value.status,
      agreement_id: value.agreementId,
      proposal_id: value.proposalId,
      lead_id: value.leadId,
      organization_id: value.organizationId,
      project_id: value.projectId,
      client_business_name: value.clientBusinessName,
      client_contact_name: value.clientContactName,
      client_email: value.clientEmail,
      client_phone: value.clientPhone,
      issued_at: value.issuedAt,
      due_at: value.dueAt,
      notes: value.notes,
      subtotal: value.subtotal,
      total_amount: value.totalAmount,
      amount_paid: value.amountPaid,
      sent_at: value.status === "sent" ? now : null,
      paid_at: value.status === "paid" ? now : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create invoice." };
  }

  const itemsError = await replaceItems(auth.supabase, data.id, value.items);
  if (itemsError) return { ok: false, error: itemsError };

  revalidateInvoiceTargets({
    id: data.id,
    leadId: value.leadId,
    organizationId: value.organizationId,
    agreementId: value.agreementId,
  });
  return { ok: true, id: data.id };
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invoice id." };

  const parsed = parseInput(input);
  if (!("value" in parsed)) return parsed;

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("invoices")
    .select(
      "id, status, sent_at, paid_at, organization_id, lead_id, agreement_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Invoice not found." };

  const value = parsed.value;
  const now = new Date().toISOString();

  const { error } = await auth.supabase
    .from("invoices")
    .update({
      title: value.title,
      invoice_type: value.invoiceType,
      status: value.status,
      agreement_id: value.agreementId,
      proposal_id: value.proposalId,
      lead_id: value.leadId,
      organization_id: value.organizationId,
      project_id: value.projectId,
      client_business_name: value.clientBusinessName,
      client_contact_name: value.clientContactName,
      client_email: value.clientEmail,
      client_phone: value.clientPhone,
      issued_at: value.issuedAt,
      due_at: value.dueAt,
      notes: value.notes,
      subtotal: value.subtotal,
      total_amount: value.totalAmount,
      amount_paid: value.amountPaid,
      sent_at:
        value.status === "sent" ? (existing.sent_at ?? now) : existing.sent_at,
      paid_at:
        value.status === "paid" ? (existing.paid_at ?? now) : existing.paid_at,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  const itemsError = await replaceItems(auth.supabase, id, value.items);
  if (itemsError) return { ok: false, error: itemsError };

  if (value.invoiceType === "deposit" && value.status === "paid") {
    await syncLeadOnDepositPaid(
      auth.supabase,
      value.leadId ?? existing.lead_id,
    );
  }

  revalidateInvoiceTargets({
    id,
    leadId: value.leadId ?? existing.lead_id,
    organizationId: value.organizationId ?? existing.organization_id,
    agreementId: value.agreementId ?? existing.agreement_id,
  });
  return { ok: true, id };
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invoice id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("invoices")
    .select("lead_id, organization_id, agreement_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await auth.supabase.from("invoices").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateInvoiceTargets({
    leadId: existing?.lead_id,
    organizationId: existing?.organization_id,
    agreementId: existing?.agreement_id,
  });
  return { ok: true };
}

export async function markInvoiceSent(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invoice id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("invoices")
    .select("lead_id, organization_id, agreement_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Invoice not found." };

  const now = new Date().toISOString();
  const { error } = await auth.supabase
    .from("invoices")
    .update({
      status: "sent",
      sent_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidateInvoiceTargets({
    id,
    leadId: existing.lead_id,
    organizationId: existing.organization_id,
    agreementId: existing.agreement_id,
  });
  return { ok: true, id };
}

export async function markInvoicePaid(
  id: string,
  amountPaid?: number,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invoice id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("invoices")
    .select(
      "lead_id, organization_id, agreement_id, invoice_type, total_amount",
    )
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Invoice not found." };

  const total = Number(existing.total_amount ?? 0);
  const paid =
    amountPaid !== undefined && !Number.isNaN(amountPaid)
      ? amountPaid
      : total;

  if (paid < 0 || paid > total) {
    return { ok: false, error: "Invalid amount paid." };
  }

  const now = new Date().toISOString();
  const { error } = await auth.supabase
    .from("invoices")
    .update({
      status: "paid",
      amount_paid: paid,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  if (existing.invoice_type === "deposit") {
    await syncLeadOnDepositPaid(auth.supabase, existing.lead_id);
  }

  revalidateInvoiceTargets({
    id,
    leadId: existing.lead_id,
    organizationId: existing.organization_id,
    agreementId: existing.agreement_id,
  });
  revalidatePath("/admin/pipeline");
  return { ok: true, id };
}

export async function createDepositInvoiceFromAgreement(
  agreementId: string,
): Promise<ActionResult> {
  if (!agreementId) return { ok: false, error: "Missing agreement id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const loaded = await loadAgreement(auth.supabase, agreementId);
  if (!("agreement" in loaded)) return loaded;

  const agreement = loaded.agreement;
  const total = Number(agreement.total_amount ?? 0);
  const depositPercent =
    agreement.deposit_percent === null ||
    agreement.deposit_percent === undefined
      ? null
      : Number(agreement.deposit_percent);

  const depositAmount =
    depositPercent === null || Number.isNaN(depositPercent)
      ? total
      : Math.round(total * (depositPercent / 100) * 100) / 100;

  const description =
    depositPercent !== null && !Number.isNaN(depositPercent)
      ? `Deposit (${depositPercent}%) — ${agreement.title}`
      : `Deposit — ${agreement.title}`;

  const invoiceNumber = await nextDocumentNumber(
    auth.supabase,
    "invoices",
    "invoice_number",
    "INV",
  );

  const { data, error } = await auth.supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      title: `Deposit — ${agreement.title}`,
      invoice_type: "deposit",
      status: "draft",
      agreement_id: agreement.id,
      proposal_id: agreement.proposal_id,
      lead_id: agreement.lead_id,
      organization_id: agreement.organization_id,
      client_business_name: agreement.client_business_name,
      client_contact_name: agreement.client_contact_name,
      client_email: agreement.client_email,
      client_phone: agreement.client_phone,
      issued_at: todayDateOnly(),
      due_at: addDaysDateOnly(14),
      notes: agreement.notes,
      subtotal: depositAmount,
      total_amount: depositAmount,
      amount_paid: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create invoice." };
  }

  const itemsError = await replaceItems(auth.supabase, data.id, [
    {
      description,
      quantity: 1,
      unitPrice: depositAmount,
      lineTotal: depositAmount,
    },
  ]);
  if (itemsError) return { ok: false, error: itemsError };

  revalidateInvoiceTargets({
    id: data.id,
    leadId: agreement.lead_id,
    organizationId: agreement.organization_id,
    agreementId: agreement.id,
  });
  return { ok: true, id: data.id };
}

export async function createInvoiceFromAgreement(
  agreementId: string,
): Promise<ActionResult> {
  if (!agreementId) return { ok: false, error: "Missing agreement id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const loaded = await loadAgreement(auth.supabase, agreementId);
  if (!("agreement" in loaded)) return loaded;

  const agreement = loaded.agreement;
  const agreementItems = [...(agreement.agreement_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  if (!agreementItems.length) {
    return { ok: false, error: "Agreement has no line items." };
  }

  const items = agreementItems.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unit_price) || 0,
    lineTotal: Number(item.line_total) || 0,
  }));

  const totals = computeTotals(
    items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  );

  const invoiceNumber = await nextDocumentNumber(
    auth.supabase,
    "invoices",
    "invoice_number",
    "INV",
  );

  const { data, error } = await auth.supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      title: agreement.title,
      invoice_type: "progress",
      status: "draft",
      agreement_id: agreement.id,
      proposal_id: agreement.proposal_id,
      lead_id: agreement.lead_id,
      organization_id: agreement.organization_id,
      client_business_name: agreement.client_business_name,
      client_contact_name: agreement.client_contact_name,
      client_email: agreement.client_email,
      client_phone: agreement.client_phone,
      issued_at: todayDateOnly(),
      due_at: addDaysDateOnly(14),
      notes: agreement.notes,
      subtotal: totals.subtotal,
      total_amount: totals.total,
      amount_paid: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create invoice." };
  }

  const itemsError = await replaceItems(auth.supabase, data.id, items);
  if (itemsError) return { ok: false, error: itemsError };

  revalidateInvoiceTargets({
    id: data.id,
    leadId: agreement.lead_id,
    organizationId: agreement.organization_id,
    agreementId: agreement.id,
  });
  return { ok: true, id: data.id };
}
