import { redirect } from "next/navigation";

export default async function DemoPipelineDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/demo/pipeline?leadId=${encodeURIComponent(id)}`);
}
