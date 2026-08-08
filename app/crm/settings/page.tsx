import { redirect } from "next/navigation";

import { BrandSettingsForm } from "@/components/admin/brand-settings-form";
import { getAppBrand } from "@/lib/app-brand";
import { createClient } from "@/lib/supabase/server";

export default async function CrmSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/crm/login?next=/crm/settings");
  }

  const brand = await getAppBrand();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how your company appears in the CRM and on client-facing
          documents.
        </p>
      </div>
      <BrandSettingsForm brand={brand} />
    </div>
  );
}
