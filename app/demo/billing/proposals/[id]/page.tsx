import { redirect } from "next/navigation";

export default async function DemoBillingProposalRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/demo/proposals/${id}`);
}
