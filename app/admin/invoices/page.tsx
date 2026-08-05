import { redirect } from "next/navigation";
import { FileText, Receipt } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { BillingSubnav } from "@/components/admin/billing-subnav";
import { InvoicesPanel } from "@/components/admin/invoices-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import { formatMoney } from "@/lib/billing";
import {
  invoiceBalance,
  INVOICE_STATUSES,
  INVOICE_TYPES,
  type InvoiceStatus,
  type InvoiceType,
  type InvoiceWithItems,
} from "@/lib/invoices";
import { createClient } from "@/lib/supabase/server";

type InvoicesPageProps = {
  searchParams?: Promise<{
    status?: string;
    type?: string;
  }>;
};

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const params = await searchParams;
  const statusFilter = (params?.status ?? "all") as InvoiceStatus | "all";
  const typeFilter = (params?.type ?? "all") as InvoiceType | "all";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
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
      ),
      organizations (
        id,
        name
      ),
      agreements (
        id,
        agreement_number,
        title
      )
    `,
    )
    .order("issued_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load invoices: ${error.message}`);
  }

  const invoices = (data ?? []) as InvoiceWithItems[];
  const rows = invoices.filter((row) => {
    const statusOk =
      statusFilter === "all" || row.status === statusFilter;
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
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="billing" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Invoices
          </h1>
          <p className="mt-2 text-muted-foreground">
            Request payments for deposits, progress, and final billing.
          </p>
          <BillingSubnav current="invoices" />
        </div>
        <SignOutButton />
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
        <a
          className={
            statusFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href={
            typeFilter === "all"
              ? "/admin/invoices"
              : `/admin/invoices?type=${typeFilter}`
          }
        >
          All ({invoices.length})
        </a>
        {INVOICE_STATUSES.map((status) => {
          const count = invoices.filter(
            (row) => row.status === status.value,
          ).length;
          const active = statusFilter === status.value;
          const typeQuery =
            typeFilter === "all" ? "" : `&type=${typeFilter}`;
          return (
            <a
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`/admin/invoices?status=${status.value}${typeQuery}`}
              key={status.value}
            >
              {status.label} ({count})
            </a>
          );
        })}
      </nav>

      <nav
        aria-label="Invoice type filters"
        className="mb-5 flex flex-wrap gap-2"
      >
        <a
          className={
            typeFilter === "all"
              ? "rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href={
            statusFilter === "all"
              ? "/admin/invoices"
              : `/admin/invoices?status=${statusFilter}`
          }
        >
          All types
        </a>
        {INVOICE_TYPES.map((type) => {
          const active = typeFilter === type.value;
          const statusQuery =
            statusFilter === "all" ? "" : `&status=${statusFilter}`;
          return (
            <a
              className={
                active
                  ? "rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`/admin/invoices?type=${type.value}${statusQuery}`}
              key={type.value}
            >
              {type.label}
            </a>
          );
        })}
      </nav>

      <InvoicesPanel rows={rows} />
    </main>
  );
}
