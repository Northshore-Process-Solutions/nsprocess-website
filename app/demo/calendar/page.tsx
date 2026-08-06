import Link from "next/link";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader, DemoStat } from "@/components/demo/demo-ui";
import { demoCustomers, loadDemoSeed } from "@/lib/demo/data";

export const metadata = {
  title: "Demo Calendar",
  robots: { index: false, follow: false },
};

export default async function DemoCalendarPage() {
  const seed = await loadDemoSeed();
  const customers = demoCustomers(seed);
  const sorted = [...seed.events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`Estimates, installs, and follow-ups for ${seed.business.name}.`}
        title="Calendar"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <DemoStat label="Upcoming" value={String(sorted.length)} />
        <DemoStat
          label="This week"
          value={String(
            sorted.filter(
              (event) =>
                new Date(event.startsAt).getTime() <=
                Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).length,
          )}
        />
      </section>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
        {sorted.map((event) => {
          const customer = customers.find(
            (row) => row.name === event.businessName,
          );
          return (
            <li className="px-4 py-3" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(event.startsAt).toLocaleString()} ·{" "}
                    {event.eventType}
                  </p>
                </div>
                {customer ? (
                  <Link
                    className="shrink-0 text-xs font-medium text-slate-600 hover:text-slate-900"
                    href={`/demo/businesses/${customer.id}`}
                  >
                    {customer.name}
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">
                    {event.businessName}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </DemoShell>
  );
}
