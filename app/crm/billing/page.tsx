import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileSignature,
  FileText,
  Receipt,
  ScrollText,
} from "lucide-react";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { formatMoney } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
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
      href: "/crm/proposals",
      title: "Proposals",
      description: "Draft quotes after consults — client can accept or decline.",
      icon: FileText,
      meta: `${proposalDrafts ?? 0} drafts · ${proposalSent ?? 0} sent`,
    },
    {
      href: "/crm/agreements",
      title: "Agreements",
      description: "Binding contract to sign after the quote is accepted.",
      icon: FileSignature,
      meta: `${agreementDrafts ?? 0} drafts · ${agreementSigned ?? 0} signed`,
    },
    {
      href: "/crm/invoices",
      title: "Invoices",
      description: "Deposit, progress, and final payment requests.",
      icon: Receipt,
      meta: `${invoiceOpen ?? 0} open · ${invoicePaid ?? 0} paid`,
    },
    {
      href: "/crm/statements",
      title: "Statements",
      description: "Generate a printable account snapshot by business.",
      icon: ScrollText,
      meta: `Open balance ${formatMoney(openBalance)}`,
    },
  ];

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Billing
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Proposals, agreements, invoices, and statements — one place for client paperwork and collections.
        </p>
        <BillingSubnav current="overview" />
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-400"
              href={card.href}
              key={card.href}
            >
              <div className="flex items-start gap-3">
                <Icon aria-hidden className="mt-0.5 size-4 text-slate-500" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {card.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {card.meta}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-5 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Suggested flow</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
          <li>Send a Proposal (quote) after the consult — client accepts or declines.</li>
          <li>Create an Agreement from the accepted proposal and email the signing link.</li>
          <li>Issue a deposit Invoice; mark paid when funds clear.</li>
          <li>Generate a Statement anytime a client asks for a balance view.</li>
        </ol>
      </section>
    </main>
  );
}
