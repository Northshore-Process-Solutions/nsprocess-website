import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader, DemoStat } from "@/components/demo/demo-ui";
import { formatMoney } from "@/lib/billing";
import { loadDemoSeed } from "@/lib/demo/data";

export const metadata = {
  title: "Demo Stack",
  robots: { index: false, follow: false },
};

export default async function DemoToolsPage() {
  const seed = await loadDemoSeed();
  const active = seed.tools.filter((tool) => tool.status === "active");
  const monthly = seed.tools
    .filter((tool) => tool.status === "active")
    .reduce((sum, tool) => sum + tool.monthlyCost, 0);

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`Internal tools and vendors that keep ${seed.business.name} running.`}
        title="Stack"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <DemoStat label="Tools" value={String(seed.tools.length)} />
        <DemoStat label="Active" value={String(active.length)} />
        <DemoStat label="Monthly" value={formatMoney(monthly)} />
      </section>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
        {seed.tools.map((tool) => (
          <li className="px-4 py-3" key={tool.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{tool.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {tool.category} · {tool.notes}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{tool.status}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">
                  {tool.monthlyCost > 0
                    ? `${formatMoney(tool.monthlyCost)}/mo`
                    : "—"}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </DemoShell>
  );
}
