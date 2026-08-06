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
import { demoCustomers, findLead, loadDemoSeed } from "@/lib/demo/data";
import { leadStageLabel } from "@/lib/leads";

export const metadata = {
  title: "Demo Business",
  robots: { index: false, follow: false },
};

export default async function DemoBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seed = await loadDemoSeed();
  const customer =
    demoCustomers(seed).find((row) => row.id === id) ??
    (() => {
      const lead = findLead(seed, id);
      if (!lead) return null;
      return {
        id: lead.id,
        name: lead.businessName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        stage: lead.stage,
        message: lead.message,
      };
    })();

  if (!customer) notFound();

  const relatedLeads = seed.leads.filter(
    (lead) => lead.businessName === customer.name,
  );
  const proposals = seed.proposals.filter(
    (doc) => doc.businessName === customer.name,
  );
  const agreements = seed.agreements.filter(
    (doc) => doc.businessName === customer.name,
  );
  const invoices = seed.invoices.filter(
    (doc) => doc.businessName === customer.name,
  );
  const projects = seed.projects.filter(
    (project) => project.businessName === customer.name,
  );
  const purchases = seed.purchases.filter(
    (row) => row.businessName === customer.name,
  );
  const events = seed.events.filter(
    (event) => event.businessName === customer.name,
  );
  const openBalance = invoices
    .filter((invoice) =>
      ["draft", "sent"].includes(invoice.status.toLowerCase()),
    )
    .reduce((sum, row) => sum + row.total, 0);

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        backHref="/demo/businesses"
        backLabel="Businesses"
        description={customer.message}
        title={customer.name}
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DemoStat label="Open A/R" value={formatMoney(openBalance)} />
        <DemoStat label="Pipeline" value={String(relatedLeads.length)} />
        <DemoStat label="Projects" value={String(projects.length)} />
        <DemoStat
          label="Documents"
          value={String(
            proposals.length + agreements.length + invoices.length,
          )}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DemoCard title="Account">
          <dl className="space-y-2">
            <DemoRow label="Contact" value={customer.contactName} />
            <DemoRow label="Email" value={customer.email} />
            <DemoRow label="Phone" value={customer.phone} />
            <DemoRow
              label="Pipeline stage"
              value={leadStageLabel(customer.stage as never)}
            />
          </dl>
        </DemoCard>

        <DemoCard title="Pipeline">
          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {relatedLeads.map((lead) => (
              <li key={lead.id}>
                <Link
                  className="block px-3 py-2.5 hover:bg-slate-50"
                  href={`/demo/pipeline/${lead.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      {lead.contactName}
                    </p>
                    <span className="text-xs text-slate-500">
                      {leadStageLabel(lead.stage)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                    {lead.message}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </DemoCard>

        <DemoCard title="Billing">
          <ul className="space-y-2 text-sm">
            {proposals.map((doc) => (
              <li key={doc.id}>
                <Link
                  className="font-medium text-slate-900 hover:underline"
                  href={`/demo/billing/proposals/${doc.id}`}
                >
                  Proposal {doc.number}
                </Link>
                <p className="text-xs text-slate-500">
                  {doc.status} · {formatMoney(doc.total)}
                </p>
              </li>
            ))}
            {agreements.map((doc) => (
              <li key={doc.id}>
                <Link
                  className="font-medium text-slate-900 hover:underline"
                  href={`/demo/billing/agreements/${doc.id}`}
                >
                  Agreement {doc.number}
                </Link>
                <p className="text-xs text-slate-500">
                  {doc.status} · {formatMoney(doc.total)}
                </p>
              </li>
            ))}
            {invoices.map((doc) => (
              <li key={doc.id}>
                <Link
                  className="font-medium text-slate-900 hover:underline"
                  href={`/demo/billing/invoices/${doc.id}`}
                >
                  Invoice {doc.number}
                </Link>
                <p className="text-xs text-slate-500">
                  {doc.status} · {formatMoney(doc.total)}
                </p>
              </li>
            ))}
            {proposals.length + agreements.length + invoices.length === 0 ? (
              <li className="text-slate-500">No documents yet.</li>
            ) : null}
          </ul>
        </DemoCard>

        <DemoCard title="Projects">
          <ul className="space-y-2 text-sm">
            {projects.length > 0 ? (
              projects.map((project) => (
                <li key={project.id}>
                  <Link
                    className="font-medium text-slate-900 hover:underline"
                    href={`/demo/projects/${project.id}`}
                  >
                    {project.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {project.status} · {project.nextAction}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No projects yet.</li>
            )}
          </ul>
        </DemoCard>

        <DemoCard title="Purchases">
          <ul className="space-y-2 text-sm">
            {purchases.length > 0 ? (
              purchases.map((row) => (
                <li key={row.id}>
                  <p className="font-medium text-slate-900">
                    {row.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.vendor} · {formatMoney(row.amount)} · {row.purchasedAt}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No purchases tied to this account.</li>
            )}
          </ul>
        </DemoCard>

        <DemoCard title="Calendar">
          <ul className="space-y-2 text-sm">
            {events.length > 0 ? (
              events.map((event) => (
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
              <li className="text-slate-500">No upcoming events.</li>
            )}
          </ul>
        </DemoCard>
      </div>
    </DemoShell>
  );
}
