import {
  DocumentPdfBrandFooter,
  DocumentPdfBrandHeader,
} from "@/components/admin/document-pdf-brand";
import {
  type AgreementItemRow,
  type AgreementWithItems,
} from "@/lib/agreements";
import { computeTotals, formatMoney } from "@/lib/billing";
import {
  nspsDocumentIssuer,
  type DocumentIssuer,
} from "@/lib/document-issuer";

const LINE_SLOT_COUNT = 8;

function padLineSlots(items: AgreementItemRow[]) {
  const slots: Array<AgreementItemRow | null> = [...items];
  while (slots.length < LINE_SLOT_COUNT) {
    slots.push(null);
  }
  return slots;
}

export function AgreementPdfDocument({
  agreement,
  issuer = nspsDocumentIssuer,
}: {
  agreement: AgreementWithItems;
  issuer?: DocumentIssuer;
}) {
  const items = [...(agreement.agreement_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const lineSlots = padLineSlots(items);
  const depositPercent =
    agreement.deposit_percent === null ||
    agreement.deposit_percent === undefined
      ? null
      : Number(agreement.deposit_percent);
  const totals = computeTotals(
    items.map((item) => ({
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unit_price) || 0,
    })),
  );
  const depositAmount =
    depositPercent !== null && !Number.isNaN(depositPercent)
      ? Math.round(totals.total * (depositPercent / 100) * 100) / 100
      : null;

  const termsBlocks = (agreement.terms ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <article className="proposal-pdf mx-auto max-w-[8.5in] bg-white px-8 py-7 text-[11pt] leading-[1.45] text-[#102033]">
      <DocumentPdfBrandHeader issuer={issuer} />

      <section className="mt-4 grid gap-4 border-b border-[#DCE7F2] pb-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Agreement with
          </p>
          <h1 className="mt-1 text-[16pt] font-bold leading-snug tracking-tight text-[#0B2545]">
            {agreement.client_business_name}
          </h1>
          <p className="mt-1 text-[11pt] font-medium text-[#102033]">
            {agreement.title}
          </p>
          <p className="mt-1.5 text-[10pt] text-[#5C6B7D]">
            {[
              agreement.client_contact_name,
              agreement.client_email,
              agreement.client_phone,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-2 self-start text-[10pt] sm:justify-items-end sm:text-right">
          <div>
            <dt className="text-[#5C6B7D]">Number</dt>
            <dd className="font-semibold">{agreement.agreement_number}</dd>
          </div>
          <div>
            <dt className="text-[#5C6B7D]">Issued</dt>
            <dd className="font-semibold">
              {new Date(`${agreement.issued_at}T12:00:00`).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </section>

      {agreement.scope_summary ? (
        <section className="mt-4">
          <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
            Scope
          </h2>
          <p className="mt-1.5 whitespace-pre-wrap text-[10.5pt] leading-relaxed">
            {agreement.scope_summary}
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
              <tr
                className="border-b border-[#DCE7F2]"
                key={item?.id ?? `slot-${index}`}
              >
                <td className="h-8 px-3 py-1.5 align-middle">
                  {item?.description ?? "\u00a0"}
                </td>
                <td className="h-8 px-3 py-1.5 align-middle whitespace-nowrap">
                  {item ? item.quantity : "\u00a0"}
                </td>
                <td className="h-8 px-3 py-1.5 align-middle whitespace-nowrap">
                  {item ? formatMoney(item.unit_price) : "\u00a0"}
                </td>
                <td className="h-8 px-3 py-1.5 align-middle whitespace-nowrap font-medium">
                  {item ? formatMoney(item.line_total) : "\u00a0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex flex-col items-end gap-1 text-[10.5pt]">
          <p>
            <span className="text-[#5C6B7D]">Total investment:</span>{" "}
            <span className="text-[12pt] font-bold">
              {formatMoney(totals.total)}
            </span>
          </p>
          {depositAmount !== null ? (
            <p>
              <span className="text-[#5C6B7D]">
                Deposit due on signing ({depositPercent}%):
              </span>{" "}
              <span className="font-bold">{formatMoney(depositAmount)}</span>
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

      <section className="mt-6 border-t border-[#DCE7F2] pt-5">
        <h2 className="text-[9pt] font-semibold uppercase tracking-[0.14em] text-[#5C6B7D]">
          Signature
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[9pt] text-[#5C6B7D]">Authorized signatory</p>
            <p className="mt-6 border-b border-[#102033] pb-1 text-[11pt] font-medium">
              {agreement.signer_name ?? "\u00a0"}
            </p>
          </div>
          <div>
            <p className="text-[9pt] text-[#5C6B7D]">Date</p>
            <p className="mt-6 border-b border-[#102033] pb-1 text-[11pt] font-medium">
              {agreement.signed_at
                ? new Date(agreement.signed_at).toLocaleDateString()
                : "\u00a0"}
            </p>
          </div>
        </div>
      </section>

      <DocumentPdfBrandFooter issuer={issuer} />
    </article>
  );
}
