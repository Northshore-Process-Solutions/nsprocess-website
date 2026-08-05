import Image from "next/image";

import {
  computeProposalTotals,
  formatProposalMoney,
  PROPOSAL_LINE_SLOT_COUNT,
  proposalDisplayTitle,
  type ProposalItemRow,
  type ProposalWithItems,
} from "@/lib/proposals";
import { contact } from "@/lib/site-data";

function padLineSlots(items: ProposalItemRow[]) {
  const slots: Array<ProposalItemRow | null> = [...items];
  while (slots.length < PROPOSAL_LINE_SLOT_COUNT) {
    slots.push(null);
  }
  return slots;
}

export function ProposalPdfDocument({
  proposal,
}: {
  proposal: ProposalWithItems;
}) {
  const items = [...(proposal.proposal_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const lineSlots = padLineSlots(items);
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

  const displayTitle = proposalDisplayTitle(
    proposal.title,
    proposal.client_business_name,
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

      <section className="mt-4 grid gap-4 border-b border-[#DCE7F2] pb-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Proposal for
          </p>
          <h1 className="mt-1 text-[16pt] font-bold leading-snug tracking-tight text-[#0B2545]">
            {proposal.client_business_name}
          </h1>
          <p className="mt-1 text-[11pt] font-medium text-[#102033]">
            {displayTitle}
          </p>
          <p className="mt-1.5 text-[10pt] text-[#5C6B7D]">
            {[
              proposal.client_contact_name,
              proposal.client_email,
              proposal.client_phone,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-2 self-start text-[10pt] sm:justify-items-end sm:text-right">
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
      </section>

      {proposal.scope_summary ? (
        <section className="mt-4">
          <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Scope
          </h2>
          <p className="mt-1.5 whitespace-pre-wrap text-[10.5pt] leading-relaxed">
            {proposal.scope_summary}
          </p>
        </section>
      ) : null}

      <section className="mt-4">
        <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Investment
        </h2>
        <table className="mt-2 w-full border-collapse text-[10.5pt]">
          <thead>
            <tr className="bg-[#0B2545] text-left text-white">
              <th className="w-[52%] px-3 py-1.5 font-semibold">Description</th>
              <th className="w-[12%] px-3 py-1.5 font-semibold">Qty</th>
              <th className="w-[18%] px-3 py-1.5 font-semibold">Unit</th>
              <th className="w-[18%] px-3 py-1.5 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineSlots.map((item, index) => (
              <tr className="border-b border-[#DCE7F2]" key={item?.id ?? `slot-${index}`}>
                <td className="h-8 px-3 py-1.5 align-middle">
                  {item?.description ?? "\u00a0"}
                </td>
                <td className="h-8 px-3 py-1.5 align-middle whitespace-nowrap">
                  {item ? item.quantity : "\u00a0"}
                </td>
                <td className="h-8 px-3 py-1.5 align-middle whitespace-nowrap">
                  {item ? formatProposalMoney(item.unit_price) : "\u00a0"}
                </td>
                <td className="h-8 px-3 py-1.5 align-middle whitespace-nowrap font-medium">
                  {item ? formatProposalMoney(item.line_total) : "\u00a0"}
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
        <section className="mt-4">
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

      <footer className="mt-5 border-t border-[#DCE7F2] pt-3 text-[9pt] text-[#5C6B7D]">
        North Shore Process Solutions · {contact.email} · {contact.phone}
      </footer>
    </article>
  );
}
