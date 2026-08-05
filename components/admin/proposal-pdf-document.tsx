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
    <article className="proposal-pdf mx-auto max-w-[8.5in] bg-white px-8 py-7 text-[11pt] leading-[1.45] text-[#102033]">
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

      <div className="mt-5 rounded-md bg-[#F7FAFC] px-4 py-3.5">
        <p className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Proposal
        </p>
        <h1 className="mt-1 text-[16pt] font-bold leading-snug tracking-tight text-[#0B2545]">
          {proposal.title}
        </h1>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-[10pt]">
          <div>
            <dt className="text-[#5C6B7D]">Number</dt>
            <dd className="mt-0.5 font-semibold">{proposal.proposal_number}</dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Issued</dt>
            <dd className="mt-0.5 font-semibold">
              {new Date(`${proposal.issued_at}T12:00:00`).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Valid until</dt>
            <dd className="mt-0.5 font-semibold">
              {proposal.valid_until
                ? new Date(
                    `${proposal.valid_until}T12:00:00`,
                  ).toLocaleDateString()
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-5">
        <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Prepared for
        </h2>
        <p className="mt-1.5 text-[12pt] font-semibold">
          {proposal.client_business_name}
        </p>
        <p className="mt-1 text-[10.5pt] text-[#5C6B7D]">
          {[
            proposal.client_contact_name,
            proposal.client_email,
            proposal.client_phone,
          ]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </section>

      {proposal.scope_summary ? (
        <section className="mt-5">
          <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Scope
          </h2>
          <p className="mt-1.5 whitespace-pre-wrap text-[10.5pt] leading-relaxed">
            {proposal.scope_summary}
          </p>
        </section>
      ) : null}

      <section className="mt-5">
        <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Investment
        </h2>
        <table className="mt-2 w-full border-collapse text-[10.5pt]">
          <thead>
            <tr className="bg-[#0B2545] text-left text-white">
              <th className="px-3 py-1.5 font-semibold">Description</th>
              <th className="px-3 py-1.5 font-semibold">Qty</th>
              <th className="px-3 py-1.5 font-semibold">Unit</th>
              <th className="px-3 py-1.5 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-[#DCE7F2]" key={item.id}>
                <td className="px-3 py-2">{item.description}</td>
                <td className="px-3 py-2 whitespace-nowrap">{item.quantity}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatProposalMoney(item.unit_price)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-medium">
                  {formatProposalMoney(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex flex-col items-end gap-1 text-[10.5pt]">
          <p>
            <span className="text-[#5C6B7D]">Total investment:</span>{" "}
            <span className="text-[12pt] font-bold">
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

      {termsBlocks.length > 0 ? (
        <section className="mt-5">
          <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Terms
          </h2>
          <div className="mt-1.5 space-y-2 text-[10pt] leading-relaxed">
            {termsBlocks.map((block) => (
              <p className="whitespace-pre-wrap" key={block.slice(0, 48)}>
                {block}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-6 border-t border-[#DCE7F2] pt-3 text-[9pt] text-[#5C6B7D]">
        North Shore Process Solutions · {contact.email} · {contact.phone}
      </footer>
    </article>
  );
}
