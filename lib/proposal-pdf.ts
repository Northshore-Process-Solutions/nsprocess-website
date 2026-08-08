import fs from "fs";
import path from "path";

import PDFDocument from "pdfkit";

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

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US");
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function resolvePublicLogoPath(logoSrc: string | null | undefined) {
  if (!logoSrc || logoSrc.startsWith("http://") || logoSrc.startsWith("https://")) {
    return null;
  }
  const relative = logoSrc.replace(/^\//, "");
  const fullPath = path.join(process.cwd(), "public", relative);
  return fs.existsSync(fullPath) ? fullPath : null;
}

export function proposalPdfFilename(proposal: {
  proposal_number: string;
  client_business_name?: string | null;
}) {
  const number = sanitizeFilenamePart(proposal.proposal_number) || "proposal";
  const business = sanitizeFilenamePart(proposal.client_business_name ?? "");
  return business
    ? `Proposal-${number}-${business}.pdf`
    : `Proposal-${number}.pdf`;
}

/** Build a printable proposal PDF for email attachment. */
export function buildProposalPdfBuffer(
  proposal: ProposalWithItems,
  issuer: DocumentIssuer = nspsDocumentIssuer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 50,
      info: {
        Title: `Proposal ${proposal.proposal_number}`,
        Author: issuer.name,
        Subject: proposalDisplayTitle(
          proposal.title,
          proposal.client_business_name,
        ),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;

    const items = [...(proposal.proposal_items ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const depositPercent =
      proposal.deposit_percent === null ||
      proposal.deposit_percent === undefined
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

    // Header (company text left, logo top-right — matches print PDF)
    const headerTop = doc.y;
    const logoPath = resolvePublicLogoPath(issuer.logoSrc);
    const logoMaxWidth = 72;
    const logoMaxHeight = 48;
    const textWidth = logoPath ? pageWidth - logoMaxWidth - 16 : pageWidth;

    if (logoPath) {
      doc.image(logoPath, right - logoMaxWidth, headerTop, {
        fit: [logoMaxWidth, logoMaxHeight],
      });
    }

    doc
      .fillColor("#0B2545")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(issuer.name, left, headerTop, { width: textWidth });
    if (issuer.tagline) {
      doc
        .moveDown(0.25)
        .fillColor("#5C6B7D")
        .font("Helvetica")
        .fontSize(9)
        .text(issuer.tagline, left, doc.y, { width: textWidth });
    }
    if (issuer.serviceArea) {
      doc
        .moveDown(0.2)
        .fillColor("#5C6B7D")
        .font("Helvetica")
        .fontSize(9)
        .text(issuer.serviceArea, left, doc.y, { width: textWidth });
    }
    const contactLine = [issuer.phone, issuer.email].filter(Boolean).join(" · ");
    if (contactLine) {
      doc
        .moveDown(0.15)
        .fillColor("#5C6B7D")
        .fontSize(9)
        .text(contactLine, left, doc.y, { width: textWidth });
    }

    const headerBottom = Math.max(
      doc.y,
      logoPath ? headerTop + logoMaxHeight : doc.y,
    );
    doc.y = headerBottom + 10;
    doc
      .strokeColor("#0B2545")
      .lineWidth(1.5)
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();

    doc.moveDown(0.8);

    // Client + meta
    const metaTop = doc.y;
    doc
      .fillColor("#5C6B7D")
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("PROPOSAL FOR", left, metaTop, { width: pageWidth * 0.62 });
    doc
      .moveDown(0.25)
      .fillColor("#0B2545")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(proposal.client_business_name, { width: pageWidth * 0.62 });
    doc
      .moveDown(0.2)
      .fillColor("#102033")
      .font("Helvetica")
      .fontSize(10)
      .text(displayTitle, { width: pageWidth * 0.62 });

    const clientLine = [
      proposal.client_contact_name,
      proposal.client_email,
      proposal.client_phone,
    ]
      .filter(Boolean)
      .join(" · ");
    if (clientLine) {
      doc
        .moveDown(0.2)
        .fillColor("#5C6B7D")
        .fontSize(9)
        .text(clientLine, { width: pageWidth * 0.62 });
    }

    const afterClientY = doc.y;

    doc
      .fillColor("#5C6B7D")
      .font("Helvetica")
      .fontSize(9)
      .text(`Number: ${proposal.proposal_number}`, left + pageWidth * 0.64, metaTop, {
        width: pageWidth * 0.36,
        align: "right",
      })
      .text(`Issued: ${formatDateOnly(proposal.issued_at)}`, {
        width: pageWidth * 0.36,
        align: "right",
      })
      .text(`Valid until: ${formatDateOnly(proposal.valid_until)}`, {
        width: pageWidth * 0.36,
        align: "right",
      });

    doc.y = Math.max(afterClientY, doc.y) + 14;

    // Scope
    if (proposal.scope_summary?.trim()) {
      doc
        .fillColor("#5C6B7D")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("SCOPE", left, doc.y, { width: pageWidth });
      doc
        .moveDown(0.35)
        .fillColor("#102033")
        .font("Helvetica")
        .fontSize(10)
        .text(proposal.scope_summary.trim(), {
          width: pageWidth,
          lineGap: 2,
        });
      doc.moveDown(0.7);
    }

    // Investment table
    doc
      .fillColor("#5C6B7D")
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("INVESTMENT", left, doc.y, { width: pageWidth });
    doc.moveDown(0.4);

    const colDesc = pageWidth * 0.52;
    const colQty = pageWidth * 0.12;
    const colUnit = pageWidth * 0.18;
    const colTotal = pageWidth * 0.18;
    const rowHeight = 22;

    function ensureSpace(needed: number) {
      if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    }

    function drawHeader() {
      ensureSpace(rowHeight + 8);
      const y = doc.y;
      doc.rect(left, y, pageWidth, rowHeight).fill("#0B2545");
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("Description", left + 8, y + 6, { width: colDesc - 12 })
        .text("Qty", left + colDesc, y + 6, { width: colQty - 4 })
        .text("Unit", left + colDesc + colQty, y + 6, { width: colUnit - 4 })
        .text("Total", left + colDesc + colQty + colUnit, y + 6, {
          width: colTotal - 8,
          align: "right",
        });
      doc.y = y + rowHeight;
    }

    drawHeader();

    const rows =
      items.length > 0
        ? items
        : [
            {
              id: "empty",
              description: "—",
              quantity: "",
              unit_price: "",
              line_total: "",
            },
          ];

    for (const item of rows) {
      ensureSpace(rowHeight + 4);
      const y = doc.y;
      doc
        .strokeColor("#DCE7F2")
        .lineWidth(0.5)
        .moveTo(left, y + rowHeight)
        .lineTo(right, y + rowHeight)
        .stroke();

      doc
        .fillColor("#102033")
        .font("Helvetica")
        .fontSize(9)
        .text(String(item.description || "—"), left + 8, y + 6, {
          width: colDesc - 12,
          height: rowHeight - 8,
          ellipsis: true,
        })
        .text(String(item.quantity ?? ""), left + colDesc, y + 6, {
          width: colQty - 4,
        })
        .text(
          item.description === "—"
            ? ""
            : formatProposalMoney(item.unit_price),
          left + colDesc + colQty,
          y + 6,
          { width: colUnit - 4 },
        )
        .text(
          item.description === "—"
            ? ""
            : formatProposalMoney(item.line_total),
          left + colDesc + colQty + colUnit,
          y + 6,
          { width: colTotal - 8, align: "right" },
        );

      doc.y = y + rowHeight;
    }

    doc.moveDown(0.6);
    ensureSpace(56);

    const amountColWidth = 90;
    const labelColWidth = pageWidth - amountColWidth - 8;
    const amountX = left + labelColWidth + 8;

    function drawTotalsRow(label: string, amount: string, amountBold = false) {
      ensureSpace(22);
      const y = doc.y;
      doc
        .fillColor("#5C6B7D")
        .font("Helvetica")
        .fontSize(10)
        .text(label, left, y, {
          width: labelColWidth,
          align: "right",
          lineBreak: false,
        });
      doc
        .fillColor("#0B2545")
        .font(amountBold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(amountBold ? 12 : 10)
        .text(amount, amountX, y, {
          width: amountColWidth,
          align: "right",
          lineBreak: false,
        });
      doc.y = y + (amountBold ? 18 : 16);
    }

    drawTotalsRow(
      "Total investment:",
      formatProposalMoney(totals.total),
      true,
    );

    if (totals.depositAmount !== null) {
      drawTotalsRow(
        `Deposit due on acceptance (${depositPercent}%):`,
        formatProposalMoney(totals.depositAmount),
      );
    }

    // Terms
    const terms = proposal.terms?.trim();
    if (terms) {
      doc.moveDown(0.9);
      ensureSpace(60);
      doc
        .fillColor("#5C6B7D")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("TERMS", left, doc.y, { width: pageWidth });
      doc
        .moveDown(0.35)
        .fillColor("#102033")
        .font("Helvetica")
        .fontSize(9)
        .text(terms, { width: pageWidth, lineGap: 2 });
    }

    // Footer
    doc.moveDown(1.2);
    ensureSpace(30);
    doc
      .fillColor("#5C6B7D")
      .font("Helvetica")
      .fontSize(8)
      .text(
        [issuer.name, issuer.email, issuer.phone].filter(Boolean).join(" · "),
        left,
        doc.y,
        { width: pageWidth, align: "center" },
      );

    doc.end();
  });
}
