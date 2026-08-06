import Link from "next/link";
import {
  FileSignature,
  FileText,
  Receipt,
  ScrollText,
} from "lucide-react";

import { BillingSubnav } from "@/components/admin/billing-subnav";
import { formatMoney } from "@/lib/billing";
import { loadDemoCrmData } from "@/lib/demo/data";
import { portalPath } from "@/lib/portal/paths";

export const metadata = {
  title: "Demo Billing",
  robots: { index: false, follow: false },
};

export default async function DemoBillingPage() {
  const data = await loadDemoCrmData();
  const base = portalPath("demo");

  const proposalDrafts = data.proposals.filter((row) => row.status === "draft")
    .length;
  const proposalSent = data.proposals.filter((row) => row.status === "sent")
    .length;
  const agreementDrafts = data.agreements.filter((row) => row.status === "draft")
    .length;
  const agreementSigned = data.agreements.filter(
    (row) => row.status === "signed",
  ).length;
  const invoiceOpen = data.invoices.filter((row) =>
    ["draft", "sent"].includes(row.status),
  ).length;
  const invoicePaid = data.invoices.filter((row) => row.status === "paid")
    .length;

  const openBalance = data.invoices
    .filter((row) => ["draft", "sent"].includes(row.status))
    .reduce(
      (sum, row) =>
        sum + Math.max(0, Number(row.total_amount ?? 0) - Number(row.amount_paid ?? 0)),
      0,
    );

  const cards = [
    {
      href: `${base}/proposals`,
      title: "Proposals",
      description: "Draft quotes after consults — client can accept or decline.",
      icon: FileText,
      meta: `${proposalDrafts} drafts · ${proposalSent} sent`,
    },
    {
      href: `${base}/agreements`,
      title: "Agreements",
      description: "Binding contract to sign after the quote is accepted.",
      icon: FileSignature,
      meta: `${agreementDrafts} drafts · ${agreementSigned} signed`,
    },
    {
      href: `${base}/invoices`,
      title: "Invoices",
      description: "Deposit, progress, and final payment requests.",
      icon: Receipt,
      meta: `${invoiceOpen} open · ${invoicePaid} paid`,
    },
    {
      href: `${base}/statements`,
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
          Proposals, agreements, invoices, and statements — one place for client
          paperwork and collections.
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
          <li>Send a Proposal after the consult.</li>
          <li>Create an Agreement from the proposal and get it signed.</li>
          <li>Issue a deposit Invoice; mark paid when funds clear.</li>
          <li>Generate a Statement anytime a client asks for a balance view.</li>
        </ol>
      </section>
    </main>
  );
}
