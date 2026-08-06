import { redirect } from "next/navigation";

import {
  createDepositInvoiceFromAgreement,
  createInvoiceFromAgreement,
} from "@/app/crm/invoices/actions";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { createClient } from "@/lib/supabase/server";

type NewInvoicePageProps = {
  searchParams?: Promise<{
    agreementId?: string;
    mode?: string;
  }>;
};

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const params = await searchParams;
  const agreementId = params?.agreementId;
  const mode = params?.mode ?? "full";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  if (agreementId) {
    const result =
      mode === "deposit"
        ? await createDepositInvoiceFromAgreement(agreementId)
        : await createInvoiceFromAgreement(agreementId);

    if (!result.ok || !result.id) {
      throw new Error(result.error ?? "Failed to create invoice from agreement.");
    }

    redirect(`/crm/invoices/${result.id}`);
  }

  return (
    <main className="max-w-5xl">

      <InvoiceEditor mode="create" />
    </main>
  );
}
