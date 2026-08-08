import { BrandSettingsForm } from "@/components/admin/brand-settings-form";
import { getAppBrand } from "@/lib/app-brand";

export default async function CrmCompanySettingsPage() {
  const brand = await getAppBrand();
  return <BrandSettingsForm brand={brand} />;
}
