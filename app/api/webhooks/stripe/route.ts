import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  applyInvoicePaid,
  assertCheckoutAmountMatchesInvoice,
} from "@/lib/invoices/apply-payment";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    console.error("Stripe webhook signature failed", error);
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await handleCheckoutCompleted(session);
    if (!result.ok) {
      console.error("Stripe checkout apply failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") {
    return { ok: true as const };
  }

  if (session.payment_status !== "paid") {
    return { ok: true as const };
  }

  const invoiceId = session.metadata?.invoice_id?.trim();
  if (!invoiceId) {
    return { ok: false as const, error: "Missing invoice_id in session metadata." };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Service role unavailable.",
    };
  }

  const { data: invoice, error: loadError } = await admin
    .from("invoices")
    .select("id, status, total_amount, amount_paid")
    .eq("id", invoiceId)
    .maybeSingle();

  if (loadError || !invoice) {
    return {
      ok: false as const,
      error: loadError?.message ?? "Invoice not found.",
    };
  }

  if (invoice.status === "paid") {
    return { ok: true as const };
  }

  const amountOk = await assertCheckoutAmountMatchesInvoice({
    totalAmount: invoice.total_amount,
    amountPaid: invoice.amount_paid,
    stripeAmountTotalCents: session.amount_total,
  });

  if (!amountOk) {
    return {
      ok: false as const,
      error: `Checkout amount mismatch for invoice ${invoiceId}.`,
    };
  }

  const amountPaid =
    session.amount_total != null
      ? session.amount_total / 100
      : Number(invoice.total_amount);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  return applyInvoicePaid({
    invoiceId,
    amountPaid,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
  });
}
