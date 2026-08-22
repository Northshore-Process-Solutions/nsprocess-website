import { redirect } from "next/navigation";

import {
  createDepositInvoiceFromAgreement,
  createInvoiceFromAgreement,
} from "@/app/crm/invoices/actions";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import {
  mapOrganizationToCrmRow,
  ORGANIZATION_DOCUMENT_SELECT,
  organizationDocumentDefaults,
  type OrganizationRow,
} from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

type NewInvoicePageProps = {
  searchParams?: Promise<{
    agreementId?: string;
    mode?: string;
    organizationId?: string;
  }>;
};

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const params = await searchParams;
  const agreementId = params?.agreementId;
  const mode = params?.mode ?? "full";
  const organizationId = params?.organizationId;

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

  let organizationDefaults: ReturnType<typeof organizationDocumentDefaults> | undefined;

  if (organizationId) {
    const { data, error } = await supabase
      .from("organizations")
      .select(ORGANIZATION_DOCUMENT_SELECT)
      .eq("id", organizationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load business: ${error.message}`);
    }

    if (data) {
      organizationDefaults = organizationDocumentDefaults(
        mapOrganizationToCrmRow(data as unknown as OrganizationRow),
      );
    }
  }

  return (
    <main className="max-w-5xl">
      <InvoiceEditor defaults={organizationDefaults} mode="create" />
    </main>
  );
}
