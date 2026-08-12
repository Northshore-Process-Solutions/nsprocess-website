import { revalidatePath } from "next/cache";

import { invoiceBalance } from "@/lib/invoices";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type ApplyPaidInput = {
  invoiceId: string;
  amountPaid: number;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
};

/**
 * Mark an invoice paid via service role (webhooks / background).
 * Idempotent when already paid.
 */
export async function applyInvoicePaid(input: ApplyPaidInput): Promise<{
  ok: boolean;
  error?: string;
  alreadyPaid?: boolean;
}> {
  const invoiceId = input.invoiceId?.trim();
  if (!invoiceId) return { ok: false, error: "Missing invoice id." };

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Service role client unavailable.",
    };
  }

  const { data: existing, error: loadError } = await admin
    .from("invoices")
    .select(
      "id, status, invoice_type, total_amount, amount_paid, lead_id, organization_id, agreement_id",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, error: loadError?.message ?? "Invoice not found." };
  }

  if (existing.status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  if (existing.status === "void") {
    return { ok: false, error: "Cannot pay a void invoice." };
  }

  const total = Number(existing.total_amount ?? 0);
  const paid = Number(input.amountPaid);
  if (Number.isNaN(paid) || paid < 0 || paid > total + 0.01) {
    return { ok: false, error: "Invalid amount paid." };
  }

  const now = new Date().toISOString();
  const patch: Record<string, string | number> = {
    status: "paid",
    amount_paid: Math.min(paid, total),
    paid_at: now,
    updated_at: now,
  };
  if (input.stripeCheckoutSessionId) {
    patch.stripe_checkout_session_id = input.stripeCheckoutSessionId;
  }
  if (input.stripePaymentIntentId) {
    patch.stripe_payment_intent_id = input.stripePaymentIntentId;
  }

  const { error: updateError } = await admin
    .from("invoices")
    .update(patch)
    .eq("id", invoiceId)
    .neq("status", "paid");

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (existing.invoice_type === "deposit" && existing.lead_id) {
    try {
      const { convertWonLeadToCrm } = await import(
        "@/app/crm/pipeline/actions"
      );
      await convertWonLeadToCrm(
        existing.lead_id,
        "deposit_received",
        admin as never,
      );
    } catch (error) {
      console.error("applyInvoicePaid: deposit lead sync failed", error);
    }
  }

  revalidatePath("/crm/invoices");
  revalidatePath("/crm/billing");
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm");
  revalidatePath(`/crm/invoices/${invoiceId}`);
  if (existing.organization_id) {
    revalidatePath(`/crm/organizations/${existing.organization_id}`);
  }
  if (existing.agreement_id) {
    revalidatePath(`/crm/agreements/${existing.agreement_id}`);
  }

  return { ok: true };
}

export async function assertCheckoutAmountMatchesInvoice(input: {
  totalAmount: number | string;
  amountPaid: number | string;
  stripeAmountTotalCents: number | null | undefined;
}) {
  const balance = invoiceBalance({
    total_amount: input.totalAmount,
    amount_paid: input.amountPaid,
  });
  const expectedCents = Math.round(balance * 100);
  const actual = input.stripeAmountTotalCents ?? 0;
  return actual === expectedCents || (balance === 0 && actual === 0);
}
