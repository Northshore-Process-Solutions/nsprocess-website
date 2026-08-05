import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProposalPdfDocument } from "@/components/admin/proposal-pdf-document";
import { ProposalPrintButton } from "@/components/admin/proposal-print-button";
import { Button } from "@/components/ui/button";
import type { ProposalWithItems } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";

type ProposalPdfPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProposalPdfPage({
  params,
}: ProposalPdfPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      *,
      proposal_items (
        id,
        proposal_id,
        description,
        quantity,
        unit_price,
        line_total,
        sort_order,
        created_at
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load proposal: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  const proposal = data as ProposalWithItems;

  return (
    <main className="min-h-screen bg-[#F7FAFC] px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[8.5in] flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href={`/admin/proposals/${proposal.id}`}>
            <ArrowLeft aria-hidden className="size-4" />
            Back to editor
          </Link>
        </Button>
        <ProposalPrintButton />
      </div>

      <ProposalPdfDocument proposal={proposal} />

      <p className="mx-auto mt-4 max-w-[8.5in] text-center text-sm text-muted-foreground print:hidden">
        Use <strong>Print / Save as PDF</strong>, choose “Save as PDF” as the
        destination, then attach the file to your email.
      </p>
    </main>
  );
}
