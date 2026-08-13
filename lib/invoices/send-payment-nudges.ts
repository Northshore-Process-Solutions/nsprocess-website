import { fallbackAppBrand } from "@/lib/app-brand";
import {
  createInvoiceShareToken,
  invoiceShareUrl,
} from "@/lib/invoice-share";
import { invoiceBalance } from "@/lib/invoices";
import { escapeHtml, sendAppEmail } from "@/lib/mail";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const NUDGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type InvoiceNudgeSummary = {
  scanned: number;
  sent: number;
  skipped: number;
  errors: string[];
};

function todayDateOnlyUtc() {
  return new Date().toISOString().slice(0, 10);
}

function isDueOrOverdue(dueAt: string | null, today: string) {
  if (!dueAt) return false;
  return dueAt <= today;
}

function canNudgeAgain(paymentNudgeSentAt: string | null, nowMs: number) {
  if (!paymentNudgeSentAt) return true;
  const last = Date.parse(paymentNudgeSentAt);
  if (Number.isNaN(last)) return true;
  return nowMs - last >= NUDGE_COOLDOWN_MS;
}

async function resolveCompanyName(
  admin: ReturnType<typeof createServiceRoleClient>,
) {
  try {
    const { data } = await admin
      .from("app_settings")
      .select("company_name")
      .eq("id", true)
      .maybeSingle();
    const name = data?.company_name?.trim();
    if (name) return name;
  } catch {
    // fall through
  }
  return fallbackAppBrand().companyName;
}

/** Email clients with overdue/due unpaid invoices that have a pay link. */
export async function sendUnpaidInvoiceNudges(): Promise<InvoiceNudgeSummary> {
  const admin = createServiceRoleClient();
  const companyName = await resolveCompanyName(admin);
  const today = todayDateOnlyUtc();
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  const { data, error } = await admin
    .from("invoices")
    .select(
      "id, invoice_number, title, status, total_amount, amount_paid, client_email, client_business_name, client_contact_name, due_at, share_token, payment_nudge_sent_at, organization_id",
    )
    .eq("status", "sent")
    .not("client_email", "is", null)
    .not("due_at", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const summary: InvoiceNudgeSummary = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  for (const invoice of data ?? []) {
    summary.scanned += 1;

    const email = invoice.client_email?.trim();
    if (!email) {
      summary.skipped += 1;
      continue;
    }

    if (!isDueOrOverdue(invoice.due_at, today)) {
      summary.skipped += 1;
      continue;
    }

    if (invoiceBalance(invoice) <= 0) {
      summary.skipped += 1;
      continue;
    }

    if (!canNudgeAgain(invoice.payment_nudge_sent_at, nowMs)) {
      summary.skipped += 1;
      continue;
    }

    let token = invoice.share_token as string | null;
    if (!token) {
      token = createInvoiceShareToken();
      const { error: tokenError } = await admin
        .from("invoices")
        .update({
          share_token: token,
          updated_at: nowIso,
        })
        .eq("id", invoice.id);

      if (tokenError) {
        summary.errors.push(
          `${invoice.invoice_number}: ${tokenError.message}`,
        );
        continue;
      }
    }

    const payUrl = invoiceShareUrl(token);
    const contact = invoice.client_contact_name?.trim() || "there";
    const dueLabel = invoice.due_at ?? "soon";
    const amount = invoiceBalance(invoice).toFixed(2);

    const mail = await sendAppEmail({
      to: email,
      subject: `Payment reminder: invoice ${invoice.invoice_number}`,
      text: [
        `Hi ${contact},`,
        "",
        `This is a friendly reminder that invoice ${invoice.invoice_number} (${invoice.title}) for ${invoice.client_business_name} is due${invoice.due_at && invoice.due_at < today ? " (overdue)" : ""}.`,
        `Amount due: $${amount}`,
        `Due date: ${dueLabel}`,
        "",
        `Pay online: ${payUrl}`,
        "",
        "You can pay by card or US bank transfer (ACH).",
        "",
        "Thank you,",
        companyName,
      ].join("\n"),
      html: `
        <p>Hi ${escapeHtml(contact)},</p>
        <p>
          This is a friendly reminder that invoice
          <strong>${escapeHtml(invoice.invoice_number)}</strong>
          (${escapeHtml(invoice.title)}) for
          <strong>${escapeHtml(invoice.client_business_name)}</strong>
          is due${invoice.due_at && invoice.due_at < today ? " (overdue)" : ""}.
        </p>
        <p>
          <strong>Amount due:</strong> $${escapeHtml(amount)}<br />
          <strong>Due date:</strong> ${escapeHtml(dueLabel)}
        </p>
        <p>
          <a href="${escapeHtml(payUrl)}">Pay online</a>
          — card or US bank transfer (ACH).
        </p>
        <p>Thank you,<br />${escapeHtml(companyName)}</p>
      `,
    });

    if (!mail.ok) {
      summary.errors.push(
        `${invoice.invoice_number}: ${mail.error ?? "email failed"}`,
      );
      continue;
    }

    const { error: stampError } = await admin
      .from("invoices")
      .update({
        payment_nudge_sent_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", invoice.id);

    if (stampError) {
      summary.errors.push(
        `${invoice.invoice_number}: sent but failed to stamp nudge (${stampError.message})`,
      );
    }

    summary.sent += 1;
  }

  return summary;
}
