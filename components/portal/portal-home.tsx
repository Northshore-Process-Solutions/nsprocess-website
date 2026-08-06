import Link from "next/link";

import { formatMoney } from "@/lib/billing";
import { leadStageLabel, type LeadRow } from "@/lib/leads";
import { invoiceBalance, type InvoiceRow } from "@/lib/invoices";
import type { ProposalRow } from "@/lib/proposals";
import type { ProjectWithOrganization } from "@/lib/projects";
import { portalPath, type PortalMode } from "@/lib/portal/paths";

type EventLite = {
  id: string;
  title: string;
  starts_at: string;
  event_type: string;
};

export function PortalHome({
  mode,
  leadsDue,
  readyForBilling,
  drafts,
  invoices,
  events,
  projects,
}: {
  mode: PortalMode;
  leadsDue: LeadRow[];
  readyForBilling: LeadRow[];
  drafts: ProposalRow[];
  invoices: InvoiceRow[];
  events: EventLite[];
  projects: ProjectWithOrganization[];
}) {
  const href = (path = "") => portalPath(mode, path);
  const openInvoiceBalance = invoices.reduce(
    (sum, row) => sum + invoiceBalance(row),
    0,
  );

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Home
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Start here. Work the queues below in order when you are unsure what
          to do next.
        </p>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href={href("/pipeline")}
          label="Follow-ups due"
          value={String(leadsDue.length)}
        />
        <StatCard
          href={href("/pipeline")}
          label="Ready to propose"
          value={String(readyForBilling.length)}
        />
        <StatCard
          href={href("/invoices")}
          label="Open invoice $"
          value={formatMoney(openInvoiceBalance)}
        />
        <StatCard
          href={href("/calendar")}
          label="Events this week"
          value={String(events.length)}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <QueueCard
          empty="No follow-ups waiting."
          href={href("/pipeline")}
          items={leadsDue.map((lead) => ({
            key: lead.id,
            href: href("/pipeline"),
            meta: leadStageLabel(lead.stage),
            title: lead.business_name,
            detail: lead.next_follow_up_at
              ? `Due ${lead.next_follow_up_at}`
              : "No follow-up date",
          }))}
          title="Pipeline"
        />

        <QueueCard
          empty="Nothing waiting on a proposal."
          href={href("/billing")}
          items={[
            ...readyForBilling.map((lead) => ({
              key: lead.id,
              href: href(`/proposals/new?leadId=${lead.id}`),
              meta: leadStageLabel(lead.stage),
              title: lead.business_name,
              detail: "Create or continue proposal",
            })),
            ...drafts.map((proposal) => ({
              key: proposal.id,
              href: href(`/proposals/${proposal.id}`),
              meta: "Draft proposal",
              title: proposal.client_business_name,
              detail: proposal.proposal_number,
            })),
            ...invoices.map((invoice) => ({
              key: invoice.id,
              href: href(`/invoices/${invoice.id}`),
              meta: invoice.status,
              title: invoice.client_business_name,
              detail: `${invoice.invoice_number} · ${formatMoney(invoiceBalance(invoice))} due`,
            })),
          ]}
          title="Billing"
        />

        <QueueCard
          empty="No upcoming events in the next 7 days."
          href={href("/calendar")}
          items={events.map((event) => ({
            key: event.id,
            href: href("/calendar"),
            meta: event.event_type,
            title: event.title,
            detail: new Date(event.starts_at).toLocaleString(),
          }))}
          title="Calendar"
        />

        <QueueCard
          empty="No active projects."
          href={href("/projects")}
          items={projects.map((project) => ({
            key: project.id,
            href: href(`/projects/${project.id}`),
            meta: project.status,
            title: project.name,
            detail: project.next_action
              ? project.next_action
              : (project.organizations?.name ?? "Open project"),
          }))}
          title="Projects"
        />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      className="rounded-md border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-400"
      href={href}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </Link>
  );
}

type QueueItem = {
  key: string;
  href: string;
  title: string;
  meta: string;
  detail: string;
};

function QueueCard({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: QueueItem[];
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
            <li key={item.key}>
              <Link
                className="block px-3 py-2.5 transition hover:bg-slate-50"
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
