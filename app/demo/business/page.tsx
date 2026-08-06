import { redirect } from "next/navigation";

import { DemoShell } from "@/components/demo/demo-shell";
import { formatMoney } from "@/lib/billing";
import { requireReadyDemoSession } from "@/lib/demo/session";
import { leadStageLabel } from "@/lib/leads";

export const metadata = {
  title: "Demo Business",
  robots: { index: false, follow: false },
};

export default async function DemoBusinessPage() {
  const { session } = await requireReadyDemoSession();
  if (!session?.seed) redirect("/demo");

  const { business, leads, proposals, agreements, invoices, projects, activities } =
    session.seed;

  const openInvoices = invoices.filter((invoice) =>
    ["draft", "sent"].includes(invoice.status.toLowerCase()),
  );
  const openBalance = openInvoices.reduce((sum, row) => sum + row.total, 0);

  return (
    <DemoShell businessName={business.name}>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {business.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          You are running this CRM as {business.name}
          {business.category ? ` (${business.category})` : ""}. Pipeline and
          projects below are your customers and jobs.
        </p>
      </header>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open A/R" value={formatMoney(openBalance)} />
        <Stat label="Open inquiries" value={String(leads.length)} />
        <Stat label="Active jobs" value={String(projects.length)} />
        <Stat
          label="Documents"
          value={String(proposals.length + agreements.length + invoices.length)}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Your company">
          <dl className="space-y-2 text-sm">
            <Row label="Owner / contact" value={business.contactName} />
            <Row label="Email" value={business.email} />
            <Row label="Phone" value={business.phone} />
            <Row label="Location" value={business.location} />
            <Row label="Industry" value={business.category} />
            <Row label="Notes" value={business.notes} />
          </dl>
        </Card>

        <Card title="Customers in pipeline">
          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {leads.map((lead) => (
              <li className="px-3 py-2.5" key={lead.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {lead.businessName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {lead.contactName} · {lead.message}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {leadStageLabel(lead.stage)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Job paperwork">
          <ul className="space-y-2 text-sm">
            <li>
              Latest proposal:{" "}
              {proposals[0]
                ? `${proposals[0].title} · ${formatMoney(proposals[0].total)}`
                : "—"}
            </li>
            <li>
              Latest agreement:{" "}
              {agreements[0]
                ? `${agreements[0].title} · ${agreements[0].status}`
                : "—"}
            </li>
            <li>
              Latest invoice:{" "}
              {invoices[0]
                ? `${invoices[0].title} · ${formatMoney(invoices[0].total)}`
                : "—"}
            </li>
          </ul>
        </Card>

        <Card title="Active jobs">
          <ul className="space-y-2 text-sm">
            {projects.map((project) => (
              <li key={project.id}>
                <p className="font-medium text-slate-900">{project.name}</p>
                <p className="text-xs text-slate-500">
                  {project.businessName} · {project.status} ·{" "}
                  {project.nextAction}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent activity">
          <ul className="space-y-2 text-sm">
            {activities.map((activity) => (
              <li key={activity.id}>
                <p className="font-medium text-slate-900">{activity.summary}</p>
                <p className="text-xs text-slate-500">
                  {new Date(activity.occurredAt).toLocaleString()} ·{" "}
                  {activity.kind}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DemoShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{value}</dd>
    </div>
  );
}
