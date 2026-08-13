import { toE164Us } from "@/lib/phone";

export function isOperatorSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim() &&
      process.env.SMS_NOTIFY_TO?.trim(),
  );
}

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string; skipped?: boolean };

/** Send a one-off SMS via Twilio REST API. Skips when env is incomplete. */
export async function sendSms(input: {
  to: string;
  body: string;
}): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    return { ok: false, skipped: true, error: "SMS is not configured." };
  }

  const to = toE164Us(input.to) ?? input.to.trim();
  if (!to.startsWith("+")) {
    return { ok: false, error: "SMS destination must be E.164 (+1…)." };
  }

  const fromE164 = toE164Us(from) ?? from;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
    "base64",
  );
  const body = new URLSearchParams({
    To: to,
    From: fromE164,
    Body: input.body.slice(0, 320),
  });

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const payload = (await response.json().catch(() => null)) as {
      sid?: string;
      message?: string;
      error_message?: string;
    } | null;

    if (!response.ok) {
      return {
        ok: false,
        error:
          payload?.error_message ||
          payload?.message ||
          `Twilio HTTP ${response.status}`,
      };
    }

    if (!payload?.sid) {
      return { ok: false, error: "Twilio did not return a message SID." };
    }

    return { ok: true, sid: payload.sid };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SMS send failed.",
    };
  }
}

/** Alert the operator phone when a new website inquiry arrives. */
export async function notifyOperatorNewLeadSms(input: {
  business: string;
  contactName: string;
  email: string;
  phone?: string | null;
}): Promise<SendSmsResult> {
  if (!isOperatorSmsConfigured()) {
    return { ok: false, skipped: true, error: "SMS is not configured." };
  }

  const to = process.env.SMS_NOTIFY_TO!.trim();
  const phone = input.phone?.trim();
  const body = [
    `New lead: ${input.business}`,
    `${input.contactName} · ${input.email}${phone ? ` · ${phone}` : ""}`,
    "Open Pipeline to follow up.",
  ].join("\n");

  return sendSms({ to, body });
}
