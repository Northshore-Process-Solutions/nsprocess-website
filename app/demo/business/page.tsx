import { redirect } from "next/navigation";

import { DemoShell } from "@/components/demo/demo-shell";
import { formatMoney } from "@/lib/billing";
import { requireReadyDemoSession } from "@/lib/demo/session";

export const metadata = {
  title: "Demo Business",
  robots: { index: false, follow: false },
};

export default async function DemoBusinessPage() {
  const { session } = await requireReadyDemoSession();
  if (!session?.seed) redirect("/demo");

  const { business, leads, proposals, agreements, invoices, projects, activities } =
    session.seed;

  return (
    <DemoShell businessName={business.name}>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {business.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Account hub view for the demo business.
        </p>
      </header>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open balance" value={formatMoney(business.openBalance)} />
        <Stat label="Pipeline" value={String(leads.length)} />
        <Stat label="Projects" value={String(projects.length)} />
        <Stat
          label="Documents"
          value={String(proposals.length + agreements.length + invoices.length)}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account">
          <dl className="space-y-2 text-sm">
            <Row label="Contact" value={business.contactName} />
            <Row label="Email" value={business.email} />
            <Row label="Phone" value={business.phone} />
            <Row label="Location" value={business.location} />
            <Row label="Category" value={business.category} />
            <Row label="Notes" value={business.notes} />
          </dl>
        </Card>

        <Card title="Billing snapshot">
          <ul className="space-y-2 text-sm">
            <li>
              Latest proposal:{" "}
              {proposals[0]
                ? `${proposals[0].number} · ${formatMoney(proposals[0].total)}`
                : "—"}
            </li>
            <li>
              Latest agreement:{" "}
              {agreements[0]
                ? `${agreements[0].number} · ${agreements[0].status}`
                : "—"}
            </li>
            <li>
              Latest invoice:{" "}
              {invoices[0]
                ? `${invoices[0].number} · ${formatMoney(invoices[0].total)}`
                : "—"}
            </li>
          </ul>
        </Card>

        <Card title="Projects">
          <ul className="space-y-2 text-sm">
            {projects.map((project) => (
              <li key={project.id}>
                <p className="font-medium text-slate-900">{project.name}</p>
                <p className="text-xs text-slate-500">
                  {project.status} · {project.nextAction}
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
