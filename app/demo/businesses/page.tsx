import { CrmPanel } from "@/components/admin/crm-panel";
import { loadDemoCrmData } from "@/lib/demo/data";

export const metadata = {
  title: "Demo Businesses",
  robots: { index: false, follow: false },
};

export default async function DemoBusinessesPage() {
  const data = await loadDemoCrmData();

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Businesses
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Company records and contacts. Inquiries live in Pipeline; delivery
          work lives in Projects.
        </p>
      </header>

      <CrmPanel readOnly rows={data.businessRows} />
    </main>
  );
}
