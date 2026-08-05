import Image from "next/image";

import { formatMoney } from "@/lib/billing";
import {
  invoiceBalance,
  invoiceStatusLabel,
  invoiceTypeLabel,
  type InvoiceItemRow,
  type InvoiceWithItems,
} from "@/lib/invoices";
import { contact } from "@/lib/site-data";

export function InvoicePdfDocument({
  invoice,
}: {
  invoice: InvoiceWithItems;
}) {
  const items = [...(invoice.invoice_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const balance = invoiceBalance(invoice);
  const amountPaid = Number(invoice.amount_paid ?? 0);

  return (
    <article className="invoice-pdf mx-auto max-w-[8.5in] bg-white px-8 py-7 text-[11pt] leading-[1.45] text-[#102033]">
      <header className="flex items-start justify-between gap-6 border-b-2 border-[#0B2545] pb-4">
        <div className="min-w-0">
          <p className="text-[15pt] font-bold leading-none tracking-tight text-[#0B2545]">
            North Shore Process Solutions
          </p>
          <p className="mt-1.5 text-[10pt] text-[#5C6B7D]">
            Helping small businesses get their time back.
          </p>
          <p className="mt-2 text-[10pt] leading-relaxed text-[#5C6B7D]">
            {contact.serviceArea}
            <br />
            {contact.phone} · {contact.email}
          </p>
        </div>
        <Image
          alt="North Shore Process Solutions"
          className="h-12 w-auto shrink-0"
          height={48}
          src="/transparentLogo.png"
          width={48}
        />
      </header>

      <section className="mt-4 grid gap-4 border-b border-[#DCE7F2] pb-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Bill to
          </p>
          <h1 className="mt-1 text-[16pt] font-bold leading-snug tracking-tight text-[#0B2545]">
            {invoice.client_business_name}
          </h1>
          <p className="mt-1 text-[11pt] font-medium text-[#102033]">
            {invoice.title}
          </p>
          <p className="mt-1.5 text-[10pt] text-[#5C6B7D]">
            {[
              invoice.client_contact_name,
              invoice.client_email,
              invoice.client_phone,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-2 self-start text-[10pt] sm:justify-items-end sm:text-right">
          <div>
            <dt className="text-[#5C6B7D]">Invoice number</dt>
            <dd className="font-semibold">{invoice.invoice_number}</dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Issued</dt>
            <dd className="font-semibold">
              {new Date(`${invoice.issued_at}T12:00:00`).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Due</dt>
            <dd className="font-semibold">
              {invoice.due_at
                ? new Date(`${invoice.due_at}T12:00:00`).toLocaleDateString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Type</dt>
            <dd className="font-semibold">
              {invoiceTypeLabel(invoice.invoice_type)}
            </dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Status</dt>
            <dd className="font-semibold">
              {invoiceStatusLabel(invoice.status)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4">
        <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Line items
        </h2>
        <table className="mt-2 w-full border-collapse text-[10.5pt]">
          <thead>
            <tr className="bg-[#0B2545] text-left text-white">
              <th className="w-[52%] px-3 py-1.5 font-semibold">Description</th>
              <th className="w-[12%] px-3 py-1.5 font-semibold">Qty</th>
              <th className="w-[18%] px-3 py-1.5 font-semibold">Unit</th>
              <th className="w-[18%] px-3 py-1.5 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: InvoiceItemRow) => (
              <tr className="border-b border-[#DCE7F2]" key={item.id}>
                <td className="px-3 py-1.5 align-middle">{item.description}</td>
                <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                  {item.quantity}
                </td>
                <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                  {formatMoney(item.unit_price)}
                </td>
                <td className="px-3 py-1.5 align-middle whitespace-nowrap font-medium">
                  {formatMoney(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex flex-col items-end gap-1 text-[10.5pt]">
          <p>
            <span className="text-[#5C6B7D]">Subtotal:</span>{" "}
            <span className="font-semibold">
              {formatMoney(invoice.subtotal)}
            </span>
          </p>
          <p>
            <span className="text-[#5C6B7D]">Total:</span>{" "}
            <span className="text-[12pt] font-bold">
              {formatMoney(invoice.total_amount)}
            </span>
          </p>
          <p>
            <span className="text-[#5C6B7D]">Amount paid:</span>{" "}
            <span className="font-semibold">{formatMoney(amountPaid)}</span>
          </p>
          <p>
            <span className="text-[#5C6B7D]">Balance due:</span>{" "}
            <span className="text-[12pt] font-bold">
              {formatMoney(balance)}
            </span>
          </p>
        </div>
      </section>

      {invoice.notes ? (
        <section className="mt-4">
          <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Notes
          </h2>
          <p className="mt-1.5 whitespace-pre-wrap text-[10.5pt] leading-relaxed">
            {invoice.notes}
          </p>
        </section>
      ) : null}

      <footer className="mt-5 border-t border-[#DCE7F2] pt-3 text-[9pt] text-[#5C6B7D]">
        North Shore Process Solutions · {contact.email} · {contact.phone}
      </footer>
    </article>
  );
}
