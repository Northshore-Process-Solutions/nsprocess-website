"use server";

import { revalidatePath } from "next/cache";

import {
  createInvoiceShareToken,
  invoiceShareUrl,
} from "@/lib/invoice-share";
import { invoiceBalance } from "@/lib/invoices";
import {
  dollarsToStripeCents,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe";
import { getAppOrigin } from "@/lib/proposal-share";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type ActionResult = {
  ok: boolean;
  error?: string;
  token?: string;
  shareUrl?: string;
  checkoutUrl?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { supabase, error: "You must be signed in." as const };
  }
  return { supabase, error: null };
}

/** Mint (or return) a public pay link. Marks draft invoices as sent. */
export async function ensureInvoicePayLink(
  invoiceId: string,
): Promise<ActionResult> {
  if (!invoiceId) return { ok: false, error: "Missing invoice id." };

  const auth = await requireUser();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: existing, error: loadError } = await auth.supabase
    .from("invoices")
    .select(
      "id, status, share_token, total_amount, amount_paid, organization_id, agreement_id",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, error: loadError?.message ?? "Invoice not found." };
  }

  if (existing.status === "void") {
    return { ok: false, error: "Void invoices cannot be paid online." };
  }

  const balance = invoiceBalance(existing);
  if (existing.status === "paid" || balance <= 0) {
    return { ok: false, error: "This invoice is already paid." };
  }

  const now = new Date().toISOString();
  let token = existing.share_token as string | null;
  if (!token) {
    token = createInvoiceShareToken();
  }

  const patch: Record<string, string | null> = {
    share_token: token,
    updated_at: now,
  };

  if (existing.status === "draft") {
    patch.status = "sent";
    patch.sent_at = now;
  }

  const { error: updateError } = await auth.supabase
    .from("invoices")
    .update(patch)
    .eq("id", invoiceId);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/crm/invoices");
  revalidatePath(`/crm/invoices/${invoiceId}`);
  revalidatePath("/crm/billing");
  if (existing.organization_id) {
    revalidatePath(`/crm/organizations/${existing.organization_id}`);
  }
  if (existing.agreement_id) {
    revalidatePath(`/crm/agreements/${existing.agreement_id}`);
  }

  return {
    ok: true,
    token,
    shareUrl: invoiceShareUrl(token),
  };
}

/** Create a Stripe Checkout session from a public pay-page token. */
export async function startInvoiceCheckout(
  token: string,
): Promise<ActionResult> {
  const trimmed = token?.trim();
  if (!trimmed) return { ok: false, error: "Missing pay link." };

  if (!isStripeConfigured()) {
    return {
      ok: false,
      error: "Online payment is not configured yet. Contact the sender.",
    };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Payment is not configured on this server.",
    };
  }

  const { data: invoice, error: loadError } = await admin
    .from("invoices")
    .select(
      "id, invoice_number, title, status, total_amount, amount_paid, client_email, client_business_name, share_token",
    )
    .eq("share_token", trimmed)
    .maybeSingle();

  if (loadError || !invoice) {
    return { ok: false, error: "Invoice not found." };
  }

  if (invoice.status === "void") {
    return { ok: false, error: "This invoice is void." };
  }

  if (invoice.status === "paid") {
    return { ok: false, error: "This invoice is already paid." };
  }

  if (invoice.status !== "sent" && invoice.status !== "draft") {
    return { ok: false, error: "This invoice is not open for payment." };
  }

  const balance = invoiceBalance(invoice);
  if (balance <= 0) {
    return { ok: false, error: "Nothing due on this invoice." };
  }

  const cents = dollarsToStripeCents(balance);
  if (cents < 50) {
    return {
      ok: false,
      error: "Amount due must be at least $0.50 to pay online.",
    };
  }

  const origin = getAppOrigin();
  const successUrl = `${origin}/i/${trimmed}?paid=1`;
  const cancelUrl = `${origin}/i/${trimmed}?canceled=1`;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: invoice.client_email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: cents,
            product_data: {
              name: `${invoice.invoice_number} — ${invoice.title}`,
              description: `Payment for ${invoice.client_business_name}`,
            },
          },
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        share_token: trimmed,
        invoice_number: invoice.invoice_number,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }

    await admin
      .from("invoices")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
        ...(invoice.status === "draft"
          ? { status: "sent", sent_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", invoice.id);

    return { ok: true, checkoutUrl: session.url };
  } catch (error) {
    console.error("startInvoiceCheckout failed", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not start checkout.",
    };
  }
}
