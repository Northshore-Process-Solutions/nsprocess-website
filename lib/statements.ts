import { formatMoney } from "@/lib/billing";
import {
  invoiceBalance,
  invoiceStatusLabel,
  invoiceTypeLabel,
  type InvoiceWithItems,
} from "@/lib/invoices";

export type StatementInvoiceRow = {
  id: string;
  invoiceNumber: string;
  title: string;
  invoiceType: string;
  status: string;
  issuedAt: string;
  dueAt: string | null;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
};

export type StatementSummary = {
  totalInvoiced: number;
  totalPaid: number;
  balanceDue: number;
  rows: StatementInvoiceRow[];
};

export function buildStatementSummary(
  invoices: InvoiceWithItems[],
): StatementSummary {
  const rows: StatementInvoiceRow[] = invoices.map((invoice) => {
    const totalAmount = Number(invoice.total_amount ?? 0);
    const amountPaid = Number(invoice.amount_paid ?? 0);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      title: invoice.title,
      invoiceType: invoiceTypeLabel(invoice.invoice_type),
      status: invoiceStatusLabel(invoice.status),
      issuedAt: invoice.issued_at,
      dueAt: invoice.due_at,
      totalAmount,
      amountPaid,
      balanceDue: invoiceBalance(invoice),
    };
  });

  const totalInvoiced = rows.reduce((sum, row) => sum + row.totalAmount, 0);
  const totalPaid = rows.reduce((sum, row) => sum + row.amountPaid, 0);
  const balanceDue = rows.reduce((sum, row) => sum + row.balanceDue, 0);

  return {
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
    rows,
  };
}

export function formatStatementDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

export { formatMoney };
