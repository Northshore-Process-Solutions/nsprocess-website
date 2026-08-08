import Image from "next/image";

import {
  issuerFooterLine,
  type DocumentIssuer,
} from "@/lib/document-issuer";

export function DocumentPdfBrandHeader({
  issuer,
  subtitle,
}: {
  issuer: DocumentIssuer;
  /** Overrides issuer.tagline when set (e.g. “Account statement”). */
  subtitle?: string | null;
}) {
  const line = subtitle !== undefined ? subtitle : issuer.tagline;
  const phone = issuer.phone?.trim() || null;
  const email = issuer.email?.trim() || null;

  return (
    <header className="flex items-start justify-between gap-6 border-b-2 border-[#0B2545] pb-4">
      <div className="min-w-0">
        <p className="text-[15pt] font-bold leading-none tracking-tight text-[#0B2545]">
          {issuer.name}
        </p>
        {line ? (
          <p className="mt-1.5 text-[10pt] text-[#5C6B7D]">{line}</p>
        ) : null}
        {issuer.serviceArea || phone || email ? (
          <div className="mt-2 space-y-0.5 text-[10pt] leading-relaxed text-[#5C6B7D]">
            {issuer.serviceArea ? <p>{issuer.serviceArea}</p> : null}
            {phone ? <p>{phone}</p> : null}
            {email ? <p className="break-all">{email}</p> : null}
          </div>
        ) : null}
      </div>
      {issuer.logoSrc ? (
        <Image
          alt={issuer.logoAlt ?? issuer.name}
          className="h-12 w-auto shrink-0"
          height={48}
          src={issuer.logoSrc}
          width={48}
        />
      ) : null}
    </header>
  );
}

export function DocumentPdfBrandFooter({
  issuer,
}: {
  issuer: DocumentIssuer;
}) {
  return (
    <footer className="mt-5 border-t border-[#DCE7F2] pt-3 text-[9pt] text-[#5C6B7D]">
      {issuerFooterLine(issuer)}
    </footer>
  );
}
