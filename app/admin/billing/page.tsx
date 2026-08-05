import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileSignature,
  FileText,
  Receipt,
  ScrollText,
} from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { BillingSubnav } from "@/components/admin/billing-subnav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import { formatMoney } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const [
    { count: proposalDrafts },
    { count: proposalSent },
    { count: agreementDrafts },
    { count: agreementSigned },
    { count: invoiceOpen },
    { count: invoicePaid },
    { data: openInvoices },
  ] = await Promise.all([
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("agreements")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("agreements")
      .select("*", { count: "exact", head: true })
      .eq("status", "signed"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .in("status", ["draft", "sent"]),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid"),
    supabase
      .from("invoices")
      .select("total_amount, amount_paid, status")
      .in("status", ["draft", "sent"]),
  ]);

  const openBalance = (openInvoices ?? []).reduce((sum, row) => {
    return (
      sum +
      Math.max(0, Number(row.total_amount ?? 0) - Number(row.amount_paid ?? 0))
    );
  }, 0);

  const cards = [
    {
      href: "/admin/proposals",
      title: "Proposals",
      description: "Draft and send engagement offers after consults.",
      icon: FileText,
      meta: `${proposalDrafts ?? 0} drafts · ${proposalSent ?? 0} sent`,
    },
    {
      href: "/admin/agreements",
      title: "Agreements",
      description: "Lock scope and terms once a proposal is ready.",
      icon: FileSignature,
      meta: `${agreementDrafts ?? 0} drafts · ${agreementSigned ?? 0} signed`,
    },
    {
      href: "/admin/invoices",
      title: "Invoices",
      description: "Deposit, progress, and final payment requests.",
      icon: Receipt,
      meta: `${invoiceOpen ?? 0} open · ${invoicePaid ?? 0} paid`,
    },
    {
      href: "/admin/statements",
      title: "Statements",
      description: "Generate a printable account snapshot by business.",
      icon: ScrollText,
      meta: `Open balance ${formatMoney(openBalance)}`,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="billing" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Billing
          </h1>
          <p className="mt-2 text-muted-foreground">
            Proposals, agreements, invoices, and statements — one place for
            client paperwork and collections.
          </p>
          <BillingSubnav current="overview" />
        </div>
        <SignOutButton />
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:border-accent/40 hover:bg-secondary/30"
              href={card.href}
              key={card.href}
            >
              <div className="flex items-start gap-3">
                <Icon aria-hidden className="mt-0.5 size-5 text-accent" />
                <div>
                  <h2 className="text-lg font-semibold">{card.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                  <p className="mt-3 text-sm font-semibold">{card.meta}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold">Suggested flow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Send a Proposal after the consult.</li>
          <li>Create an Agreement from the proposal and get it signed.</li>
          <li>Issue a deposit Invoice; mark paid when funds clear.</li>
          <li>Generate a Statement anytime a client asks for a balance view.</li>
        </ol>
      </section>
    </main>
  );
}
