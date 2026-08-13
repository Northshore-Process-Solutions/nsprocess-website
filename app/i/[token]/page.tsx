import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvoicePayButton } from "@/components/share/invoice-pay-button";
import { getAppBrand } from "@/lib/app-brand";
import { formatMoney } from "@/lib/billing";
import {
  invoiceBalance,
  invoiceStatusLabel,
  invoiceTypeLabel,
  type InvoiceWithItems,
} from "@/lib/invoices";
import { isStripeConfigured } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type PublicInvoicePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Invoice payment",
    robots: { index: false, follow: false },
    description: "View and pay your invoice.",
  };
}

export default async function PublicInvoicePayPage({
  params,
  searchParams,
}: PublicInvoicePageProps) {
  const { token } = await params;
  const query = await searchParams;
  if (!token?.trim()) notFound();

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    throw new Error("Invoice payments are not configured on this server.");
  }

  const { data, error } = await admin
    .from("invoices")
    .select(
      `
      *,
      invoice_items (
        id,
        invoice_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      )
    `,
    )
    .eq("share_token", token.trim())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load invoice: ${error.message}`);
  }
  if (!data) notFound();

  const invoice = data as InvoiceWithItems;
  if (invoice.status === "void") notFound();

  const brand = await getAppBrand();
  const balance = invoiceBalance(invoice);
  const items = [...(invoice.invoice_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const justPaid = query.paid === "1" || invoice.status === "paid";
  const canceled = query.canceled === "1";
  const canPay =
    !justPaid &&
    invoice.status !== "paid" &&
    balance > 0 &&
    (invoice.status === "sent" || invoice.status === "draft");
  const stripeReady = isStripeConfigured();

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {brand.companyName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Invoice {invoice.invoice_number}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{invoice.title}</p>
        </header>

        {justPaid ? (
          <div
            className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"
            role="status"
          >
            <p className="font-semibold">Payment received</p>
            <p className="mt-1 text-emerald-900/90">
              Thank you. This invoice is marked paid
              {invoice.paid_at
                ? ` as of ${new Date(invoice.paid_at).toLocaleString()}`
                : ""}
              .
            </p>
          </div>
        ) : null}

        {query.paid === "1" && !justPaid ? (
          <div
            className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"
            role="status"
          >
            <p className="font-semibold">Payment submitted</p>
            <p className="mt-1 text-sky-900/90">
              If you paid by card, confirmation is usually immediate. Bank
              transfers (ACH) can take a few business days to clear — we&apos;ll
              mark this invoice paid when the payment settles.
            </p>
          </div>
        ) : null}

        {canceled && !justPaid ? (
          <div
            className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
            role="status"
          >
            Payment was canceled. You can try again below when ready.
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Bill to</dt>
              <dd className="text-right font-medium text-slate-900">
                {invoice.client_business_name}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Type</dt>
              <dd className="font-medium text-slate-900">
                {invoiceTypeLabel(invoice.invoice_type)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-slate-900">
                {invoiceStatusLabel(invoice.status)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Issued</dt>
              <dd className="font-medium text-slate-900">
                {invoice.issued_at}
              </dd>
            </div>
            {invoice.due_at ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Due</dt>
                <dd className="font-medium text-slate-900">{invoice.due_at}</dd>
              </div>
            ) : null}
          </dl>

          {items.length > 0 ? (
            <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
              {items.map((item) => (
                <li
                  className="flex justify-between gap-3 text-sm"
                  key={item.id}
                >
                  <span className="min-w-0 text-slate-700">
                    {item.description}
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {item.quantity} × {formatMoney(Number(item.unit_price))}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatMoney(Number(item.line_total))}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 space-y-1 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total</span>
              <span className="font-medium tabular-nums">
                {formatMoney(Number(invoice.total_amount))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid</span>
              <span className="font-medium tabular-nums">
                {formatMoney(Number(invoice.amount_paid))}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-semibold text-slate-900">Amount due</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatMoney(balance)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            {canPay && stripeReady ? (
              <InvoicePayButton balanceDue={balance} token={token.trim()} />
            ) : null}
            {canPay && !stripeReady ? (
              <p className="text-sm text-slate-600">
                Online payment is temporarily unavailable. Please contact{" "}
                {brand.companyName}
                {brand.email ? ` at ${brand.email}` : ""} to arrange payment.
              </p>
            ) : null}
            {!canPay && !justPaid ? (
              <p className="text-sm text-slate-600">
                This invoice is not open for online payment.
              </p>
            ) : null}
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure card or US bank transfer (ACH) via Stripe.
        </p>
      </div>
    </main>
  );
}
