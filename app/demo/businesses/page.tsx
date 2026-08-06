import Link from "next/link";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader, DemoStat } from "@/components/demo/demo-ui";
import { formatMoney } from "@/lib/billing";
import { demoCustomers, loadDemoSeed } from "@/lib/demo/data";
import { leadStageLabel } from "@/lib/leads";

export const metadata = {
  title: "Demo Businesses",
  robots: { index: false, follow: false },
};

export default async function DemoBusinessesPage() {
  const seed = await loadDemoSeed();
  const customers = demoCustomers(seed);

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`Customer accounts for ${seed.business.name} — click any row to open the account hub.`}
        title="Businesses"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <DemoStat label="Customers" value={String(customers.length)} />
        <DemoStat
          label="Open A/R"
          value={formatMoney(
            seed.invoices
              .filter((invoice) =>
                ["draft", "sent"].includes(invoice.status.toLowerCase()),
              )
              .reduce((sum, row) => sum + row.total, 0),
          )}
        />
        <DemoStat label="Active jobs" value={String(seed.projects.length)} />
      </section>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Business</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                className="border-t border-slate-100 hover:bg-slate-50"
                key={customer.id}
              >
                <td className="px-3 py-2.5">
                  <Link
                    className="font-medium text-slate-900 hover:underline"
                    href={`/demo/businesses/${customer.id}`}
                  >
                    {customer.name}
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {customer.message}
                  </p>
                </td>
                <td className="px-3 py-2.5">{customer.contactName}</td>
                <td className="px-3 py-2.5">
                  {leadStageLabel(customer.stage as never)}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{customer.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
