import Link from "next/link";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader, DemoStat } from "@/components/demo/demo-ui";
import { formatMoney } from "@/lib/billing";
import { loadDemoSeed } from "@/lib/demo/data";
import { leadStageLabel } from "@/lib/leads";

export const metadata = {
  title: "Demo Home",
  robots: { index: false, follow: false },
};

export default async function DemoHomePage() {
  const seed = await loadDemoSeed();
  const today = new Date().toISOString().slice(0, 10);
  const followUps = seed.leads.filter(
    (lead) =>
      !["deposit_received", "won", "lost"].includes(lead.stage) &&
      (!lead.nextFollowUpAt || lead.nextFollowUpAt <= today),
  );
  const readyToPropose = seed.leads.filter((lead) =>
    ["review_completed", "proposal_sent"].includes(lead.stage),
  );
  const openInvoices = seed.invoices.filter((invoice) =>
    ["draft", "sent"].includes(invoice.status.toLowerCase()),
  );
  const openInvoiceTotal = openInvoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0,
  );
  const weekOut = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const events = seed.events.filter(
    (event) => new Date(event.startsAt).getTime() <= weekOut,
  );

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`You are logged in as ${seed.business.name}. These queues are your customers, jobs, and paperwork — same layout as the live portal.`}
        title="Home"
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DemoStat label="Follow-ups due" value={String(followUps.length)} />
        <DemoStat
          label="Ready to propose"
          value={String(readyToPropose.length)}
        />
        <DemoStat label="Open invoice $" value={formatMoney(openInvoiceTotal)} />
        <DemoStat label="Events this week" value={String(events.length)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Queue
          empty="No follow-ups waiting."
          href="/demo/pipeline"
          items={followUps.map((lead) => ({
            href: `/demo/pipeline/${lead.id}`,
            title: lead.businessName,
            meta: leadStageLabel(lead.stage),
            detail: lead.nextFollowUpAt
              ? `Due ${lead.nextFollowUpAt}`
              : "No follow-up date",
          }))}
          title="Pipeline"
        />
        <Queue
          empty="Nothing waiting in billing."
          href="/demo/billing"
          items={[
            ...seed.proposals
              .filter((doc) => doc.status.toLowerCase() === "draft")
              .map((doc) => ({
                href: `/demo/billing/proposals/${doc.id}`,
                title: doc.businessName,
                meta: "Draft proposal",
                detail: doc.number,
              })),
            ...openInvoices.map((doc) => ({
              href: `/demo/billing/invoices/${doc.id}`,
              title: doc.businessName,
              meta: doc.status,
              detail: `${doc.number} · ${formatMoney(doc.total)}`,
            })),
          ]}
          title="Billing"
        />
        <Queue
          empty="No upcoming events."
          href="/demo/calendar"
          items={events.map((event) => ({
            href: "/demo/calendar",
            title: event.title,
            meta: event.eventType,
            detail: new Date(event.startsAt).toLocaleString(),
          }))}
          title="Calendar"
        />
        <Queue
          empty="No active projects."
          href="/demo/projects"
          items={seed.projects.map((project) => ({
            href: `/demo/projects/${project.id}`,
            title: project.name,
            meta: project.status,
            detail: project.nextAction,
          }))}
          title="Projects"
        />
      </div>
    </DemoShell>
  );
}

function Queue({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: Array<{
    href: string;
    title: string;
    meta: string;
    detail: string;
  }>;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <Link
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
          href={href}
        >
          View all
        </Link>
      </div>
      {items.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={`${item.href}-${item.detail}`}>
              <Link
                className="block px-3 py-2.5 hover:bg-slate-50"
                href={item.href}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-xs text-slate-500">
                    {item.meta}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-4 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}
