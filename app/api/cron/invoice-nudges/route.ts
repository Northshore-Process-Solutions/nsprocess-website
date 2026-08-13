import { NextResponse } from "next/server";

import { sendUnpaidInvoiceNudges } from "@/lib/invoices/send-payment-nudges";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(request: Request) {
  const secret =
    process.env.CRON_SECRET?.trim() ||
    process.env.INVOICE_NUDGE_SECRET?.trim() ||
    process.env.DEMO_PURGE_SECRET?.trim();

  if (!secret) {
    // Allow in local/dev without a secret; require one in production-like envs.
    if (process.env.VERCEL_ENV === "production") {
      return false;
    }
    return true;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function runNudges(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const summary = await sendUnpaidInvoiceNudges();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invoice nudges.";
    console.error("invoice nudges failed", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Vercel Cron uses GET; allow POST for manual runs. */
export async function GET(request: Request) {
  return runNudges(request);
}

export async function POST(request: Request) {
  return runNudges(request);
}
