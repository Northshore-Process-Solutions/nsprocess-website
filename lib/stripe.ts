import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add it to .env.local (and Vercel) to enable invoice payments.",
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing STRIPE_WEBHOOK_SECRET. Add the Stripe webhook signing secret.",
    );
  }
  return secret;
}

/** Convert USD dollars to Stripe integer cents. */
export function dollarsToStripeCents(amount: number) {
  return Math.round(amount * 100);
}
