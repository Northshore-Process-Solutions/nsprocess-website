import { DemoDocDetailPage } from "@/components/demo/demo-doc-detail";

export const metadata = {
  title: "Demo Agreement",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DemoDocDetailPage id={id} kind="agreements" />;
}
