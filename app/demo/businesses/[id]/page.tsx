import { redirect } from "next/navigation";

export default async function DemoBusinessDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = id.startsWith("org-") ? id : `org-${id}`;
  redirect(`/demo/organizations/${orgId}`);
}
