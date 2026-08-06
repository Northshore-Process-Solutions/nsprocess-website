import { redirect } from "next/navigation";

export default async function DemoPipelineDetailRedirectPage() {
  redirect("/demo/pipeline");
}
