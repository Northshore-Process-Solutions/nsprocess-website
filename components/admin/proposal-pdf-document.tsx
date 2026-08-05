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

  const termsBlocks = (proposal.terms ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <article className="proposal-pdf mx-auto max-w-[8.5in] bg-white px-6 py-5 text-[10.5pt] leading-[1.35] text-[#102033]">
      <header className="flex items-center justify-between gap-4 border-b border-[#0B2545] pb-2.5">
        <div className="min-w-0">
          <p className="text-[12.5pt] font-bold leading-none tracking-tight text-[#0B2545]">
            North Shore Process Solutions
          </p>
          <p className="mt-1 text-[9pt] text-[#5C6B7D]">
            Helping small businesses get their time back.
          </p>
          <p className="mt-1 text-[9pt] text-[#5C6B7D]">
            {contact.serviceArea} · {contact.phone} · {contact.email}
          </p>
        </div>
        <Image
          alt="North Shore Process Solutions"
          className="h-10 w-auto shrink-0"
          height={40}
          src="/transparentLogo.png"
          width={40}
        />
      </header>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[#DCE7F2] pb-2.5">
        <div className="min-w-0">
          <p className="text-[8pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Proposal
          </p>
          <h1 className="mt-0.5 text-[14pt] font-bold leading-snug tracking-tight text-[#0B2545]">
            {proposal.title}
          </h1>
        </div>
        <dl className="grid grid-cols-3 gap-x-4 text-[9pt]">
          <div>
            <dt className="text-[#5C6B7D]">Number</dt>
            <dd className="font-semibold">{proposal.proposal_number}</dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Issued</dt>
            <dd className="font-semibold">
              {new Date(`${proposal.issued_at}T12:00:00`).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Valid until</dt>
            <dd className="font-semibold">
              {proposal.valid_until
                ? new Date(
                    `${proposal.valid_until}T12:00:00`,
                  ).toLocaleDateString()
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-3 grid gap-x-6 gap-y-1 border-b border-[#DCE7F2] pb-2.5 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-[8pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Prepared for
          </h2>
          <p className="mt-0.5 font-semibold">{proposal.client_business_name}</p>
          <p className="text-[9.5pt] text-[#5C6B7D]">
            {[
              proposal.client_contact_name,
              proposal.client_email,
              proposal.client_phone,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        {proposal.scope_summary ? (
          <div>
            <h2 className="text-[8pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
              Scope
            </h2>
            <p className="mt-0.5 whitespace-pre-wrap text-[9.5pt] leading-[1.35]">
              {proposal.scope_summary}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-3">
        <h2 className="text-[8pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Investment
        </h2>
        <table className="mt-1.5 w-full border-collapse text-[9.5pt]">
          <thead>
            <tr className="bg-[#0B2545] text-left text-white">
              <th className="px-2 py-1 font-semibold">Description</th>
              <th className="px-2 py-1 font-semibold">Qty</th>
              <th className="px-2 py-1 font-semibold">Unit</th>
              <th className="px-2 py-1 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-[#DCE7F2]" key={item.id}>
                <td className="px-2 py-1">{item.description}</td>
                <td className="px-2 py-1 whitespace-nowrap">{item.quantity}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {formatProposalMoney(item.unit_price)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap font-medium">
                  {formatProposalMoney(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-1.5 flex flex-wrap items-baseline justify-end gap-x-4 gap-y-0.5 text-[9.5pt]">
          <p>
            <span className="text-[#5C6B7D]">Total:</span>{" "}
            <span className="text-[11pt] font-bold">
              {formatProposalMoney(totals.total)}
            </span>
          </p>
          {totals.depositAmount !== null ? (
            <p>
              <span className="text-[#5C6B7D]">
                Deposit ({depositPercent}%):
              </span>{" "}
              <span className="font-bold">
                {formatProposalMoney(totals.depositAmount)}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      {termsBlocks.length > 0 ? (
        <section className="mt-3 border-t border-[#DCE7F2] pt-2">
          <h2 className="text-[8pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Terms
          </h2>
          <div className="mt-1 space-y-1 text-[9pt] leading-[1.3]">
            {termsBlocks.map((block) => (
              <p className="whitespace-pre-wrap" key={block.slice(0, 40)}>
                {block}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
