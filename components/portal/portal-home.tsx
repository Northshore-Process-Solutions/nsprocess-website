import Link from "next/link";

import { SpamFlagBadge } from "@/components/admin/spam-flag-badge";
import { formatMoney } from "@/lib/billing";
import {
  buildHomeDashboard,
  type AgreementLite,
  type HomeQueueItem,
  type StatusTone,
} from "@/lib/portal/home-dashboard";
import type { InvoiceRow } from "@/lib/invoices";
import type { LeadRow } from "@/lib/leads";
import type { ProposalRow } from "@/lib/proposals";
import type { ProjectWithOrganization } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { PortalMode } from "@/lib/portal/paths";

type EventLite = {
  id: string;
  title: string;
  starts_at: string;
  event_type: string;
};

export function PortalHome({
  mode,
  leadsDue,
  readyToPropose,
  draftProposals,
  sentProposals,
  acceptedProposals,
  customerLeadIds,
  agreements,
  invoices,
  events,
  projects,
}: {
  mode: PortalMode;
  leadsDue: LeadRow[];
  readyToPropose: LeadRow[];
  draftProposals: ProposalRow[];
  sentProposals: ProposalRow[];
  acceptedProposals: ProposalRow[];
  customerLeadIds?: Set<string>;
  agreements: AgreementLite[];
  invoices: InvoiceRow[];
  events: EventLite[];
  projects: ProjectWithOrganization[];
}) {
  const dash = buildHomeDashboard({
    mode,
    leadsDue,
    readyToPropose,
    draftProposals,
    sentProposals,
    acceptedProposals,
    customerLeadIds,
    agreements,
    invoices,
    events,
    projects,
  });

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Home
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Morning command center — who to call, what to send, what to collect.
        </p>
      </header>

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          href={dash.href("/pipeline")}
          label="Follow-ups due"
          value={String(dash.followUpsDueCount)}
        />
        <StatCard
          href={dash.href("/pipeline")}
          label="Ready to propose"
          value={String(dash.readyToProposeCount)}
        />
        <StatCard
          emphasize={dash.acceptedJobsCount > 0}
          href={dash.href("/pipeline?phase=accepted")}
          label="Accepted jobs"
          value={String(dash.acceptedJobsCount)}
        />
        <StatCard
          emphasizeMoney
          href={dash.href("/invoices")}
          label="Open invoice $"
          value={formatMoney(dash.openInvoiceBalance)}
        />
        <StatCard
          href={dash.href("/calendar")}
          label="Events this week"
          value={String(dash.eventsCount)}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <QueueCard
          empty="No pipeline work waiting."
          href={dash.href("/pipeline")}
          items={dash.pipeline}
          title="Pipeline"
        />
        <QueueCard
          empty="No accepted jobs need follow-up."
          href={dash.href("/pipeline?phase=accepted")}
          items={dash.acceptedJobs}
          title="Accepted Jobs"
        />
        <QueueCard
          empty="Nothing to collect right now."
          href={dash.href("/invoices")}
          items={dash.billing}
          title="Billing"
        />
        <QueueCard
          empty="No appointments this week."
          href={dash.href("/calendar")}
          items={dash.calendar}
          title="Calendar"
        />
        <QueueCard
          empty="No active projects right now."
          href={dash.href("/projects")}
          items={dash.projects}
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
  emphasize = false,
  emphasizeMoney = false,
}: {
  label: string;
  value: string;
  href: string;
  emphasize?: boolean;
  emphasizeMoney?: boolean;
}) {
  return (
    <Link
      className={
        emphasize
          ? "rounded-md border border-lime-300 bg-lime-50 px-3 py-3 transition hover:border-lime-500"
          : emphasizeMoney
            ? "rounded-md border border-slate-300 bg-white px-3 py-3 shadow-sm transition hover:border-slate-500"
            : "rounded-md border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-400"
      }
      href={href}
    >
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          emphasizeMoney ? "text-slate-700" : "text-slate-500",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 tabular-nums text-slate-900",
          emphasizeMoney ? "text-2xl font-bold tracking-tight" : "text-xl font-semibold",
        )}
      >
        {value}
      </p>
    </Link>
  );
}

function QueueCard({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: HomeQueueItem[];
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <Link
          className="text-[11px] font-normal text-slate-400 transition hover:text-slate-600"
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
                className="block min-w-0 px-3 py-3 transition hover:bg-slate-50"
                href={item.href}
              >
                <p className="truncate text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{item.nextAction}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {item.spamFlag ? (
                    <SpamFlagBadge compact reason={item.spamReason} />
                  ) : null}
                  <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                  {item.dueLabel ? (
                    <span className="text-[11px] font-medium text-slate-500">
                      {item.dueLabel}
                    </span>
                  ) : null}
                </div>
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

function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        badgeToneClass(tone),
      )}
    >
      {label}
    </span>
  );
}

function badgeToneClass(tone: StatusTone) {
  switch (tone) {
    case "blue":
      return "bg-sky-100 text-sky-900";
    case "orange":
      return "bg-orange-100 text-orange-900";
    case "green":
      return "bg-emerald-100 text-emerald-900";
    case "purple":
      return "bg-violet-100 text-violet-900";
    case "darkGreen":
      return "bg-teal-800 text-white";
    case "red":
      return "bg-red-100 text-red-900";
    case "gray":
    default:
      return "bg-slate-100 text-slate-700";
  }
}
