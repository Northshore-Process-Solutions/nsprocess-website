import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoShell } from "@/components/demo/demo-shell";
import {
  DemoCard,
  DemoPageHeader,
  DemoRow,
  DemoStat,
} from "@/components/demo/demo-ui";
import { formatMoney } from "@/lib/billing";
import {
  demoCustomers,
  findProject,
  loadDemoSeed,
} from "@/lib/demo/data";

export const metadata = {
  title: "Demo Project",
  robots: { index: false, follow: false },
};

export default async function DemoProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seed = await loadDemoSeed();
  const project = findProject(seed, id);
  if (!project) notFound();

  const customer = demoCustomers(seed).find(
    (row) => row.name === project.businessName,
  );
  const relatedEvents = seed.events.filter(
    (event) => event.businessName === project.businessName,
  );
  const relatedPurchases = seed.purchases.filter(
    (row) => row.businessName === project.businessName,
  );
  const relatedInvoices = seed.invoices.filter(
    (doc) => doc.businessName === project.businessName,
  );

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        backHref="/demo/projects"
        backLabel="Projects"
        description={project.scope ?? project.nextAction}
        title={project.name}
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <DemoStat label="Status" value={project.status.replaceAll("_", " ")} />
        <DemoStat
          label="Start"
          value={project.startDate ?? "—"}
        />
        <DemoStat
          label="Target"
          value={project.targetDate ?? "—"}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DemoCard title="Delivery">
          <dl className="space-y-2">
            <DemoRow label="Customer" value={project.businessName} />
            <DemoRow label="Next action" value={project.nextAction} />
            <DemoRow
              label="Scope"
              value={project.scope ?? project.nextAction}
            />
          </dl>
          {customer ? (
            <p className="mt-4 text-sm">
              <Link
                className="font-medium text-slate-900 underline"
                href={`/demo/businesses/${customer.id}`}
              >
                Open business hub
              </Link>
            </p>
          ) : null}
        </DemoCard>

        <DemoCard title="Schedule">
          <ul className="space-y-2 text-sm">
            {relatedEvents.length > 0 ? (
              relatedEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    className="font-medium text-slate-900 hover:underline"
                    href="/demo/calendar"
                  >
                    {event.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {new Date(event.startsAt).toLocaleString()} ·{" "}
                    {event.eventType}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No scheduled events.</li>
            )}
          </ul>
        </DemoCard>

        <DemoCard title="Purchases">
          <ul className="space-y-2 text-sm">
            {relatedPurchases.length > 0 ? (
              relatedPurchases.map((row) => (
                <li key={row.id}>
                  <p className="font-medium text-slate-900">
                    {row.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.vendor} · {formatMoney(row.amount)}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No purchases on this job yet.</li>
            )}
          </ul>
        </DemoCard>

        <DemoCard title="Billing">
          <ul className="space-y-2 text-sm">
            {relatedInvoices.length > 0 ? (
              relatedInvoices.map((doc) => (
                <li key={doc.id}>
                  <Link
                    className="font-medium text-slate-900 hover:underline"
                    href={`/demo/billing/invoices/${doc.id}`}
                  >
                    {doc.number}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {doc.status} · {formatMoney(doc.total)}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No invoices yet.</li>
            )}
          </ul>
        </DemoCard>
      </div>
    </DemoShell>
  );
}
