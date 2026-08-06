import { redirect } from "next/navigation";

import { DemoShell } from "@/components/demo/demo-shell";
import { formatMoney } from "@/lib/billing";
import { requireReadyDemoSession } from "@/lib/demo/session";

export const metadata = {
  title: "Demo Billing",
  robots: { index: false, follow: false },
};

export default async function DemoBillingPage() {
  const { session } = await requireReadyDemoSession();
  if (!session?.seed) redirect("/demo");

  const seed = session.seed;

  return (
    <DemoShell businessName={seed.business.name}>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Billing
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Demo proposals, agreements, and invoices for {seed.business.name}.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <DocList title="Proposals" rows={seed.proposals} />
        <DocList title="Agreements" rows={seed.agreements} />
        <DocList title="Invoices" rows={seed.invoices} />
      </div>
    </DemoShell>
  );
}

function DocList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    total: number;
    businessName: string;
  }>;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
        {rows.map((row) => (
          <li className="px-3 py-2.5" key={row.id}>
            <p className="text-sm font-medium text-slate-900">{row.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {row.number} · {row.status} · {formatMoney(row.total)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
