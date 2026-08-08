import {
  DocumentPdfBrandFooter,
  DocumentPdfBrandHeader,
} from "@/components/admin/document-pdf-brand";
import {
  nspsDocumentIssuer,
  type DocumentIssuer,
} from "@/lib/document-issuer";
import {
  computeProposalTotals,
  formatProposalMoney,
  proposalDisplayTitle,
  type ProposalWithItems,
} from "@/lib/proposals";

/** Client-facing proposal layout optimized for phone browsers (share link). */
export function ProposalShareView({
  proposal,
  issuer = nspsDocumentIssuer,
}: {
  proposal: ProposalWithItems;
  issuer?: DocumentIssuer;
}) {
  const items = [...(proposal.proposal_items ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((item) => item.description?.trim());

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

  const contactBits = [
    proposal.client_contact_name,
    proposal.client_email,
    proposal.client_phone,
  ].filter(Boolean);

  return (
    <article className="proposal-share bg-white px-4 py-5 text-sm leading-relaxed text-[#102033] sm:px-8 sm:py-7 sm:text-[11pt]">
      <DocumentPdfBrandHeader issuer={issuer} />

      <section className="mt-4 space-y-3 border-b border-[#DCE7F2] pb-4 sm:mt-5 sm:grid sm:grid-cols-[1.4fr_1fr] sm:gap-4 sm:space-y-0">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Proposal for
          </p>
          <h1 className="mt-1 text-xl font-bold leading-snug tracking-tight text-[#0B2545] sm:text-[16pt]">
            {proposal.client_business_name}
          </h1>
          <p className="mt-1 text-sm font-medium text-[#102033] sm:text-[11pt]">
            {displayTitle}
          </p>
          {contactBits.length > 0 ? (
            <p className="mt-1.5 break-words text-xs text-[#5C6B7D] sm:text-[10pt]">
              {contactBits.join(" · ")}
            </p>
          ) : null}
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-[#F4F7FB] p-3 text-xs sm:grid-cols-1 sm:justify-items-end sm:bg-transparent sm:p-0 sm:text-right sm:text-[10pt]">
          <div>
            <dt className="text-[#5C6B7D]">Number</dt>
            <dd className="mt-0.5 font-semibold break-all">
              {proposal.proposal_number}
            </dd>
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
      </section>

      {proposal.scope_summary ? (
        <section className="mt-4 sm:mt-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Scope
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#102033] sm:text-[10.5pt] sm:leading-relaxed">
            {proposal.scope_summary}
          </p>
        </section>
      ) : null}

      <section className="mt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Investment
        </h2>

        {/* Mobile: stacked cards */}
        <ul className="mt-3 space-y-2 sm:hidden">
          {items.length === 0 ? (
            <li className="rounded-xl border border-[#DCE7F2] px-3 py-3 text-sm text-[#5C6B7D]">
              No line items listed.
            </li>
          ) : (
            items.map((item) => (
              <li
                className="rounded-xl border border-[#DCE7F2] px-3 py-3"
                key={item.id}
              >
                <p className="font-medium leading-snug text-[#102033]">
                  {item.description}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-[#5C6B7D]">
                  <span>
                    Qty {item.quantity}
                    <span className="mx-1.5 text-[#DCE7F2]">·</span>
                    {formatProposalMoney(item.unit_price)} each
                  </span>
                  <span className="text-sm font-semibold text-[#0B2545]">
                    {formatProposalMoney(item.line_total)}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Desktop / tablet: compact table */}
        <div className="mt-3 hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-[10.5pt]">
            <thead>
              <tr className="bg-[#0B2545] text-left text-white">
                <th className="px-3 py-1.5 font-semibold">Description</th>
                <th className="w-14 px-3 py-1.5 font-semibold">Qty</th>
                <th className="w-24 px-3 py-1.5 font-semibold">Unit</th>
                <th className="w-24 px-3 py-1.5 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b border-[#DCE7F2]" key={item.id}>
                  <td className="px-3 py-2 align-top">{item.description}</td>
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    {formatProposalMoney(item.unit_price)}
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap font-medium">
                    {formatProposalMoney(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1 rounded-xl bg-[#F4F7FB] px-3 py-3 text-sm sm:bg-transparent sm:px-0 sm:py-0 sm:text-right sm:text-[10.5pt]">
          <p className="flex items-baseline justify-between gap-3 sm:block">
            <span className="text-[#5C6B7D]">Total investment</span>
            <span className="text-lg font-bold text-[#0B2545] sm:text-[12pt]">
              {formatProposalMoney(totals.total)}
            </span>
          </p>
          {totals.depositAmount !== null ? (
            <p className="flex items-baseline justify-between gap-3 sm:block">
              <span className="text-[#5C6B7D]">
                Deposit ({depositPercent}%)
              </span>
              <span className="font-bold text-[#0B2545]">
                {formatProposalMoney(totals.depositAmount)}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      {termsBlocks.length > 0 ? (
        <section className="mt-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Terms
          </h2>
          <div className="mt-2 space-y-2 text-xs leading-relaxed text-[#102033] sm:text-[10pt]">
            {termsBlocks.map((block) => (
              <p className="whitespace-pre-wrap" key={block.slice(0, 48)}>
                {block}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-5 text-xs sm:text-[9pt]">
        <DocumentPdfBrandFooter issuer={issuer} />
      </div>
    </article>
  );
}
