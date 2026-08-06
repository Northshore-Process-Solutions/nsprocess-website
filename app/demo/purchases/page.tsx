import Link from "next/link";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader, DemoStat } from "@/components/demo/demo-ui";
import { formatMoney } from "@/lib/billing";
import { demoCustomers, loadDemoSeed } from "@/lib/demo/data";

export const metadata = {
  title: "Demo Purchases",
  robots: { index: false, follow: false },
};

export default async function DemoPurchasesPage() {
  const seed = await loadDemoSeed();
  const customers = demoCustomers(seed);
  const total = seed.purchases.reduce((sum, row) => sum + row.amount, 0);

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`Materials, supplies, and ops spend for ${seed.business.name}.`}
        title="Purchases"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <DemoStat label="Purchases" value={String(seed.purchases.length)} />
        <DemoStat label="Total spend" value={formatMoney(total)} />
      </section>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Vendor</th>
              <th className="px-3 py-2 font-medium">Account</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {seed.purchases.map((row) => {
              const customer = customers.find(
                (c) => c.name === row.businessName,
              );
              return (
                <tr className="border-t border-slate-100" key={row.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-900">
                      {row.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.purchaseType}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">{row.vendor}</td>
                  <td className="px-3 py-2.5">
                    {customer ? (
                      <Link
                        className="hover:underline"
                        href={`/demo/businesses/${customer.id}`}
                      >
                        {row.businessName}
                      </Link>
                    ) : (
                      row.businessName
                    )}
                  </td>
                  <td className="px-3 py-2.5">{row.purchasedAt}</td>
                  <td className="px-3 py-2.5">{formatMoney(row.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
