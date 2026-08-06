import Link from "next/link";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader } from "@/components/demo/demo-ui";
import { formatMoney } from "@/lib/billing";
import { loadDemoSeed } from "@/lib/demo/data";
import type { DemoDoc } from "@/lib/demo/types";

export const metadata = {
  title: "Demo Billing",
  robots: { index: false, follow: false },
};

export default async function DemoBillingPage() {
  const seed = await loadDemoSeed();

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`Proposals, agreements, and invoices ${seed.business.name} sends to customers.`}
        title="Billing"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <DocList
          hrefBase="/demo/billing/proposals"
          rows={seed.proposals}
          title="Proposals"
        />
        <DocList
          hrefBase="/demo/billing/agreements"
          rows={seed.agreements}
          title="Agreements"
        />
        <DocList
          hrefBase="/demo/billing/invoices"
          rows={seed.invoices}
          title="Invoices"
        />
      </div>
    </DemoShell>
  );
}

function DocList({
  title,
  rows,
  hrefBase,
}: {
  title: string;
  rows: DemoDoc[];
  hrefBase: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              className="block px-3 py-2.5 hover:bg-slate-50"
              href={`${hrefBase}/${row.id}`}
            >
              <p className="text-sm font-medium text-slate-900">{row.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {row.number} · {row.status} · {formatMoney(row.total)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
