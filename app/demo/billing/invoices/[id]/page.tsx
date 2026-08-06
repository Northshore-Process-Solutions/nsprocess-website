import { redirect } from "next/navigation";

export default async function DemoBillingInvoiceRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/demo/invoices/${id}`);
}
