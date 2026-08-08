import { PortalSettingsForm } from "@/components/admin/portal-settings-form";
import { SettingsDetailShell } from "@/components/admin/settings-nav-list";
import { getAppBrand } from "@/lib/app-brand";

export default async function CrmPortalSettingsPage() {
  const brand = await getAppBrand();

  return (
    <SettingsDetailShell
      backHref="/crm/settings/site"
      backLabel="Site settings"
      description="Label shown in the CRM header and login screen."
      title="Portal label"
    >
      <PortalSettingsForm portalName={brand.portalName} />
    </SettingsDetailShell>
  );
}
