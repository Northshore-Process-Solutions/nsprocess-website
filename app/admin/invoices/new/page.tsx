import { redirect } from "next/navigation";

import {
  createDepositInvoiceFromAgreement,
  createInvoiceFromAgreement,
} from "@/app/admin/invoices/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
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
    redirect("/admin/login");
  }

  if (agreementId) {
    const result =
      mode === "deposit"
        ? await createDepositInvoiceFromAgreement(agreementId)
        : await createInvoiceFromAgreement(agreementId);

    if (!result.ok || !result.id) {
      throw new Error(result.error ?? "Failed to create invoice from agreement.");
    }

    redirect(`/admin/invoices/${result.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="billing" />
        </div>
        <SignOutButton />
      </header>

      <InvoiceEditor mode="create" />
    </main>
  );
}
