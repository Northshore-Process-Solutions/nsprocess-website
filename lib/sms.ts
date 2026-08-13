import { toE164Us } from "@/lib/phone";

const TRIAL_TEMPLATE_ERROR = /predefined SMS templates|Invalid template name/i;

/** Twilio trial Body values (not freeform text). */
const TRIAL_TEMPLATES = [
  "sms_internal_alerts",
  "sms_account_alerts",
  "sms_event_notifications",
  "sms_customer_support",
  "sms_appointment_reminders",
  "sms_order_confirmation",
  "sms_delivery_updates",
  "sms_marketing_promotions",
  "sms_feedback_surveys",
  "sms_2fa",
] as const;

export function isOperatorSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.SMS_NOTIFY_TO?.trim() &&
      (process.env.TWILIO_FROM_NUMBER?.trim() || isTwilioTrialMode()),
  );
}

export function isTwilioTrialMode() {
  const flag = process.env.TWILIO_TRIAL?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function trialTemplateBody() {
  const configured = process.env.TWILIO_TRIAL_TEMPLATE?.trim();
  if (configured && (TRIAL_TEMPLATES as readonly string[]).includes(configured)) {
    return configured;
  }
  return "sms_internal_alerts";
}

export type SendSmsResult =
  | { ok: true; sid: string; trialTemplate?: string }
  | { ok: false; error: string; skipped?: boolean };

async function createTwilioMessage(input: {
  to: string;
  body: string;
  from?: string | null;
}): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    return { ok: false, skipped: true, error: "SMS is not configured." };
  }

  const to = toE164Us(input.to) ?? input.to.trim();
  if (!to.startsWith("+")) {
    return { ok: false, error: "SMS destination must be E.164 (+1…)." };
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
    "base64",
  );
  const params = new URLSearchParams({
    To: to,
    Body: input.body,
  });

  // Trial API docs only require To + Body; From is optional (Twilio uses trial number).
  if (input.from?.trim()) {
    const fromE164 = toE164Us(input.from) ?? input.from.trim();
    params.set("From", fromE164);
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
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

/** Send a one-off SMS via Twilio REST API. Skips when env is incomplete. */
export async function sendSms(input: {
  to: string;
  body: string;
}): Promise<SendSmsResult> {
  const from = process.env.TWILIO_FROM_NUMBER?.trim() || null;
  const trialForced = isTwilioTrialMode();
  const template = trialTemplateBody();

  if (trialForced) {
    const result = await createTwilioMessage({
      to: input.to,
      body: template,
      // Prefer omitting From on trial; include if configured.
      from,
    });
    if (result.ok) {
      return { ...result, trialTemplate: template };
    }
    // Retry without From if trial rejects the From param.
    if (from) {
      const retry = await createTwilioMessage({
        to: input.to,
        body: template,
        from: null,
      });
      if (retry.ok) return { ...retry, trialTemplate: template };
      return retry;
    }
    return result;
  }

  const freeform = await createTwilioMessage({
    to: input.to,
    body: input.body.slice(0, 320),
    from,
  });

  if (freeform.ok) return freeform;

  if (TRIAL_TEMPLATE_ERROR.test(freeform.error)) {
    const trial = await createTwilioMessage({
      to: input.to,
      body: template,
      from,
    });
    if (trial.ok) {
      console.info(
        "Twilio freeform blocked on trial; sent predefined template",
        template,
      );
      return { ...trial, trialTemplate: template };
    }
    if (from) {
      const retry = await createTwilioMessage({
        to: input.to,
        body: template,
        from: null,
      });
      if (retry.ok) {
        console.info(
          "Twilio freeform blocked on trial; sent predefined template without From",
          template,
        );
        return { ...retry, trialTemplate: template };
      }
      return retry;
    }
    return trial;
  }

  return freeform;
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
