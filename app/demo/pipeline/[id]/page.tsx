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
import { findLead, loadDemoSeed } from "@/lib/demo/data";
import { leadStageLabel } from "@/lib/leads";

export const metadata = {
  title: "Demo Lead",
  robots: { index: false, follow: false },
};

export default async function DemoPipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seed = await loadDemoSeed();
  const lead = findLead(seed, id);
  if (!lead) notFound();

  const customer = seed.leads.find((row) => row.id === lead.id);
  const proposals = seed.proposals.filter(
    (doc) => doc.businessName === lead.businessName,
  );
  const projects = seed.projects.filter(
    (project) => project.businessName === lead.businessName,
  );

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        backHref="/demo/pipeline"
        backLabel="Pipeline"
        description={lead.message}
        title={lead.businessName}
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <DemoStat label="Stage" value={leadStageLabel(lead.stage)} />
        <DemoStat
          label="Follow-up"
          value={lead.nextFollowUpAt ?? "Not set"}
        />
        <DemoStat label="Source" value={lead.source.replaceAll("_", " ")} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DemoCard title="Contact">
          <dl className="space-y-2">
            <DemoRow label="Name" value={lead.contactName} />
            <DemoRow label="Email" value={lead.email} />
            <DemoRow label="Phone" value={lead.phone} />
            <DemoRow label="Inquiry" value={lead.message} />
          </dl>
          {customer ? (
            <p className="mt-4 text-sm">
              <Link
                className="font-medium text-slate-900 underline"
                href={`/demo/businesses/${lead.id}`}
              >
                Open business hub
              </Link>
            </p>
          ) : null}
        </DemoCard>

        <DemoCard title="Related paperwork">
          <ul className="space-y-2 text-sm">
            {proposals.map((doc) => (
              <li key={doc.id}>
                <Link
                  className="font-medium text-slate-900 hover:underline"
                  href={`/demo/billing/proposals/${doc.id}`}
                >
                  {doc.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {doc.number} · {doc.status} · {formatMoney(doc.total)}
                </p>
              </li>
            ))}
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  className="font-medium text-slate-900 hover:underline"
                  href={`/demo/projects/${project.id}`}
                >
                  {project.name}
                </Link>
                <p className="text-xs text-slate-500">{project.status}</p>
              </li>
            ))}
            {proposals.length + projects.length === 0 ? (
              <li className="text-slate-500">No related docs yet.</li>
            ) : null}
          </ul>
        </DemoCard>
      </div>
    </DemoShell>
  );
}
