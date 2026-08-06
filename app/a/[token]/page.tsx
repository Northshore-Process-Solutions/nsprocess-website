import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AgreementPdfDocument } from "@/components/admin/agreement-pdf-document";
import { AgreementClientSignForm } from "@/components/share/agreement-client-sign-form";
import type { AgreementWithItems } from "@/lib/agreements";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type PublicAgreementPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Agreement",
    robots: { index: false, follow: false },
    description: "Review and sign your agreement.",
  };
}

export default async function PublicAgreementPage({
  params,
}: PublicAgreementPageProps) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    throw new Error("Agreement sharing is not configured on this server.");
  }

  const { data, error } = await admin
    .from("agreements")
    .select(
      `
      *,
      agreement_items (
        id,
        agreement_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      )
    `,
    )
    .eq("share_token", token.trim())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load agreement: ${error.message}`);
  }

  if (!data) notFound();

  const agreement = data as AgreementWithItems;
  const visibleStatuses = new Set(["draft", "sent", "signed"]);
  if (!visibleStatuses.has(agreement.status) || agreement.status === "void") {
    notFound();
  }

  // Drafts with a token are viewable only after staff emails/sends — still allow
  // if token exists (emailing marks sent). Hide pure drafts that somehow have tokens?
  // Emailing sets status to sent. If only Copy link without send, draft is ok to sign.
  const alreadySigned = Boolean(agreement.signed_at) || agreement.status === "signed";

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto mb-6 max-w-[8.5in] text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          North Shore Process Solutions
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Agreement {agreement.agreement_number}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the terms below, then sign with your full name.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
        <AgreementPdfDocument agreement={agreement} />
      </div>

      <AgreementClientSignForm
        alreadySigned={alreadySigned}
        signedAt={agreement.signed_at}
        signerName={agreement.signer_name}
        token={token.trim()}
      />
    </main>
  );
}
