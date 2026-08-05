import Image from "next/image";

import {
  computeProposalTotals,
  formatProposalMoney,
  type ProposalWithItems,
} from "@/lib/proposals";
import { contact } from "@/lib/site-data";

export function ProposalPdfDocument({
  proposal,
}: {
  proposal: ProposalWithItems;
}) {
  const items = [...(proposal.proposal_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const depositPercent =
    proposal.deposit_percent === null || proposal.deposit_percent === undefined
      ? null
      : Number(proposal.deposit_percent);
  const totals = computeProposalTotals(
    items.map((item) => ({
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unit_price) || 0,
    })),
    Number.isNaN(depositPercent as number) ? null : depositPercent,
  );

  return (
    <article className="proposal-pdf mx-auto max-w-[8.5in] bg-white px-8 py-8 text-[#102033]">
      <header className="flex items-start justify-between gap-6 border-b-2 border-[#0B2545] pb-5">
        <div>
          <p className="text-lg font-bold tracking-tight text-[#0B2545]">
            North Shore Process Solutions
          </p>
          <p className="mt-2 text-sm text-[#5C6B7D]">
            Helping small businesses get their time back.
          </p>
          <p className="mt-3 text-sm leading-6 text-[#5C6B7D]">
            {contact.serviceArea}
            <br />
            {contact.phone}
            <br />
            {contact.email}
          </p>
        </div>
        <div className="shrink-0">
          <Image
            alt="North Shore Process Solutions"
            className="h-14 w-auto"
            height={56}
            src="/transparentLogo.png"
            width={56}
          />
        </div>
      </header>

      <div className="mt-6 rounded-lg bg-[#F7FAFC] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5C6B7D]">
          Proposal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2545]">
          {proposal.title}
        </h1>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <p>
            <span className="text-[#5C6B7D]">Number:</span>{" "}
            <span className="font-semibold">{proposal.proposal_number}</span>
          </p>
          <p>
            <span className="text-[#5C6B7D]">Issued:</span>{" "}
            <span className="font-semibold">
              {new Date(`${proposal.issued_at}T12:00:00`).toLocaleDateString()}
            </span>
          </p>
          <p>
            <span className="text-[#5C6B7D]">Valid until:</span>{" "}
            <span className="font-semibold">
              {proposal.valid_until
                ? new Date(
                    `${proposal.valid_until}T12:00:00`,
                  ).toLocaleDateString()
                : "—"}
            </span>
          </p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Prepared for
        </h2>
        <p className="mt-2 text-base font-semibold">
          {proposal.client_business_name}
        </p>
        {proposal.client_contact_name ? (
          <p className="mt-1 text-sm">{proposal.client_contact_name}</p>
        ) : null}
        <p className="mt-1 text-sm text-[#5C6B7D]">
          {[proposal.client_email, proposal.client_phone]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </section>

      {proposal.scope_summary ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Scope
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {proposal.scope_summary}
          </p>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Investment
        </h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0B2545] text-left text-white">
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 font-semibold">Qty</th>
              <th className="px-3 py-2 font-semibold">Unit</th>
              <th className="px-3 py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-[#DCE7F2]" key={item.id}>
                <td className="px-3 py-2.5">{item.description}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {item.quantity}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatProposalMoney(item.unit_price)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                  {formatProposalMoney(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          <p>
            <span className="text-[#5C6B7D]">Total investment:</span>{" "}
            <span className="text-base font-bold">
              {formatProposalMoney(totals.total)}
            </span>
          </p>
          {totals.depositAmount !== null ? (
            <p>
              <span className="text-[#5C6B7D]">
                Deposit due on acceptance ({depositPercent}%):
              </span>{" "}
              <span className="font-bold">
                {formatProposalMoney(totals.depositAmount)}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      {proposal.terms ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Terms
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#102033]">
            {proposal.terms}
          </p>
        </section>
      ) : null}

      <footer className="mt-10 border-t border-[#DCE7F2] pt-4 text-xs text-[#5C6B7D]">
        Prepared by North Shore Process Solutions · {contact.email} ·{" "}
        {contact.phone}
      </footer>
    </article>
  );
}
