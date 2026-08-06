import { redirect } from "next/navigation";

/** Legacy path — Businesses is the CRM-matching list. */
export default function DemoBusinessRedirectPage() {
  redirect("/demo/businesses");
}
