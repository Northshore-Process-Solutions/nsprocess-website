import {
  DocumentPdfBrandFooter,
  DocumentPdfBrandHeader,
} from "@/components/admin/document-pdf-brand";
import {
  nspsDocumentIssuer,
  type DocumentIssuer,
} from "@/lib/document-issuer";
import type { InvoiceWithItems } from "@/lib/invoices";
import {
  buildStatementSummary,
  formatMoney,
  formatStatementDate,
  type StatementSummary,
} from "@/lib/statements";

type StatementPdfDocumentProps = {
  organizationName: string;
  from: string;
  to: string;
  invoices: InvoiceWithItems[];
  priorOpenBalance?: number;
  issuer?: DocumentIssuer;
};

export function StatementPdfDocument({
  organizationName,
  from,
  to,
  invoices,
  priorOpenBalance = 0,
  issuer = nspsDocumentIssuer,
}: StatementPdfDocumentProps) {
  const summary: StatementSummary = buildStatementSummary(invoices);
  const totalBalanceDue =
    Math.round((summary.balanceDue + priorOpenBalance) * 100) / 100;

  return (
    <article className="invoice-pdf mx-auto max-w-[8.5in] bg-white px-8 py-7 text-[11pt] leading-[1.45] text-[#102033]">
      <DocumentPdfBrandHeader issuer={issuer} subtitle="Account statement" />

      <section className="mt-4 grid gap-4 border-b border-[#DCE7F2] pb-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Account
          </p>
          <h1 className="mt-1 text-[16pt] font-bold leading-snug tracking-tight text-[#0B2545]">
            {organizationName}
          </h1>
        </div>
        <dl className="grid grid-cols-1 gap-2 self-start text-[10pt] sm:justify-items-end sm:text-right">
          <div>
            <dt className="text-[#5C6B7D]">Period</dt>
            <dd className="font-semibold">
              {formatStatementDate(from)} – {formatStatementDate(to)}
            </dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Generated</dt>
            <dd className="font-semibold">
              {new Date().toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </section>

      {priorOpenBalance > 0 ? (
        <section className="mt-4 rounded-lg border border-[#DCE7F2] bg-[#F7FAFC] px-4 py-3 text-[10.5pt]">
          <p>
            <span className="font-semibold text-[#5C6B7D]">
              Prior open balance
            </span>{" "}
            (unpaid invoices issued before {formatStatementDate(from)}):{" "}
            <span className="font-bold">{formatMoney(priorOpenBalance)}</span>
          </p>
        </section>
      ) : null}

      <section className="mt-4">
        <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Invoices in period
        </h2>
        {summary.rows.length === 0 ? (
          <p className="mt-2 text-[10.5pt] text-[#5C6B7D]">
            No invoices issued during this period.
          </p>
        ) : (
          <table className="mt-2 w-full border-collapse text-[10pt]">
            <thead>
              <tr className="bg-[#0B2545] text-left text-white">
                <th className="px-3 py-1.5 font-semibold">Invoice</th>
                <th className="px-3 py-1.5 font-semibold">Issued</th>
                <th className="px-3 py-1.5 font-semibold">Due</th>
                <th className="px-3 py-1.5 font-semibold">Type</th>
                <th className="px-3 py-1.5 font-semibold">Status</th>
                <th className="px-3 py-1.5 font-semibold">Total</th>
                <th className="px-3 py-1.5 font-semibold">Paid</th>
                <th className="px-3 py-1.5 font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr className="border-b border-[#DCE7F2]" key={row.id}>
                  <td className="px-3 py-1.5 align-middle">
                    <span className="font-medium">{row.invoiceNumber}</span>
                    <br />
                    <span className="text-[9pt] text-[#5C6B7D]">
                      {row.title}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {formatStatementDate(row.issuedAt)}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {row.dueAt ? formatStatementDate(row.dueAt) : "—"}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {row.invoiceType}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {row.status}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {formatMoney(row.totalAmount)}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {formatMoney(row.amountPaid)}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap font-medium">
                    {formatMoney(row.balanceDue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-4 flex flex-col items-end gap-1 text-[10.5pt]">
          <p>
            <span className="text-[#5C6B7D]">Total invoiced (period):</span>{" "}
            <span className="font-semibold">
              {formatMoney(summary.totalInvoiced)}
            </span>
          </p>
          <p>
            <span className="text-[#5C6B7D]">Total paid (period):</span>{" "}
            <span className="font-semibold">
              {formatMoney(summary.totalPaid)}
            </span>
          </p>
          <p>
            <span className="text-[#5C6B7D]">Balance due (period):</span>{" "}
            <span className="font-semibold">
              {formatMoney(summary.balanceDue)}
            </span>
          </p>
          {priorOpenBalance > 0 ? (
            <p>
              <span className="text-[#5C6B7D]">Prior open balance:</span>{" "}
              <span className="font-semibold">
                {formatMoney(priorOpenBalance)}
              </span>
            </p>
          ) : null}
          <p>
            <span className="text-[#5C6B7D]">Total balance due:</span>{" "}
            <span className="text-[12pt] font-bold">
              {formatMoney(totalBalanceDue)}
            </span>
          </p>
        </div>
      </section>

      <DocumentPdfBrandFooter issuer={issuer} />
    </article>
  );
}
