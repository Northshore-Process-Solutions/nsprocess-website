import { notFound, redirect } from "next/navigation";

import { SalesSubnav } from "@/components/admin/sales-subnav";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import type { ProposalWithItems } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";

type ProposalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
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
      ),
      leads (
        id,
        business_name,
        stage
      ),
      organizations (
        id,
        name
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

  const { data: agreement } = await supabase
    .from("agreements")
    .select("id, status, agreement_number")
    .eq("proposal_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let depositInvoice: {
    id: string;
    status: string;
    invoice_number: string;
  } | null = null;

  if (agreement) {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status, invoice_number")
      .eq("agreement_id", agreement.id)
      .eq("invoice_type", "deposit")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    depositInvoice = invoice;
  }

  return (
    <main>
      <header className="mb-5">
        <SalesSubnav current="proposals" />
      </header>

      <ProposalEditor
        handoff={{
          agreementId: agreement?.id ?? null,
          agreementNumber: agreement?.agreement_number ?? null,
          agreementStatus: agreement?.status ?? null,
          depositInvoiceId: depositInvoice?.id ?? null,
          depositInvoiceNumber: depositInvoice?.invoice_number ?? null,
          depositInvoiceStatus: depositInvoice?.status ?? null,
        }}
        initialProposal={data as ProposalWithItems}
        mode="edit"
      />
    </main>
  );
}
