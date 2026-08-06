import Link from "next/link";
import { FileText, Receipt } from "lucide-react";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { InvoicesPanel } from "@/components/admin/invoices-panel";
import { loadDemoCrmData } from "@/lib/demo/data";
import { portalPath } from "@/lib/portal/paths";
import { formatMoney } from "@/lib/billing";
import {
  invoiceBalance,
  INVOICE_STATUSES,
  INVOICE_TYPES,
  type InvoiceStatus,
  type InvoiceType,
} from "@/lib/invoices";

export const metadata = {
  title: "Demo Invoices",
  robots: { index: false, follow: false },
};

type DemoInvoicesPageProps = {
  searchParams?: Promise<{
    status?: string;
    type?: string;
  }>;
};

export default async function DemoInvoicesPage({
  searchParams,
}: DemoInvoicesPageProps) {
  const params = await searchParams;
  const statusFilter = (params?.status ?? "all") as InvoiceStatus | "all";
  const typeFilter = (params?.type ?? "all") as InvoiceType | "all";
  const data = await loadDemoCrmData();
  const base = portalPath("demo");

  const invoices = data.invoices;

  const rows = invoices.filter((row) => {
    const statusOk = statusFilter === "all" || row.status === statusFilter;
    const typeOk = typeFilter === "all" || row.invoice_type === typeFilter;
    return statusOk && typeOk;
  });

  const draftCount = invoices.filter((row) => row.status === "draft").length;
  const openBalance = invoices
    .filter((row) => row.status !== "paid" && row.status !== "void")
    .reduce((sum, row) => sum + invoiceBalance(row), 0);
  const paidTotal = invoices
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + Number(row.amount_paid ?? 0), 0);

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Invoices
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Request payments for deposits, progress, and final billing.
        </p>
        <BillingSubnav current="invoices" />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <FileText aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Receipt aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Open balance</p>
              <p className="text-2xl font-bold">{formatMoney(openBalance)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div>
            <p className="text-sm text-muted-foreground">Collected (paid)</p>
            <p className="text-2xl font-bold">{formatMoney(paidTotal)}</p>
          </div>
        </div>
      </section>

      <nav
        aria-label="Invoice status filters"
        className="mb-3 flex flex-wrap gap-2"
      >
        <Link
          className={
            statusFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href={`${base}/invoices`}
        >
          All statuses ({invoices.length})
        </Link>
        {INVOICE_STATUSES.map((status) => {
          const count = invoices.filter(
            (row) => row.status === status.value,
          ).length;
          const active = statusFilter === status.value;
          return (
            <Link
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`${base}/invoices?status=${status.value}`}
              key={status.value}
            >
              {status.label} ({count})
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Invoice type filters" className="mb-5 flex flex-wrap gap-2">
        <Link
          className={
            typeFilter === "all"
              ? "rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href={`${base}/invoices${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`}
        >
          All types
        </Link>
        {INVOICE_TYPES.map((type) => {
          const active = typeFilter === type.value;
          const query = new URLSearchParams();
          if (statusFilter !== "all") query.set("status", statusFilter);
          query.set("type", type.value);
          return (
            <Link
              className={
                active
                  ? "rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`${base}/invoices?${query.toString()}`}
              key={type.value}
            >
              {type.label}
            </Link>
          );
        })}
      </nav>

      <InvoicesPanel readOnly rows={rows} />
    </main>
  );
}
