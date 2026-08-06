import { redirect } from "next/navigation";

import { DemoShell } from "@/components/demo/demo-shell";
import { requireReadyDemoSession } from "@/lib/demo/session";
import { leadStageLabel } from "@/lib/leads";

export const metadata = {
  title: "Demo Pipeline",
  robots: { index: false, follow: false },
};

export default async function DemoPipelinePage() {
  const { session } = await requireReadyDemoSession();
  if (!session?.seed) redirect("/demo");

  const seed = session.seed;

  return (
    <DemoShell businessName={seed.business.name}>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Demo inquiries shaped around {seed.business.name}.
        </p>
      </header>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Business</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {seed.leads.map((lead) => (
              <tr className="border-t border-slate-100" key={lead.id}>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-900">
                    {lead.businessName}
                  </p>
                  <p className="text-xs text-slate-500">{lead.message}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p>{lead.contactName}</p>
                  <p className="text-xs text-slate-500">{lead.email}</p>
                </td>
                <td className="px-3 py-2.5">{leadStageLabel(lead.stage)}</td>
                <td className="px-3 py-2.5">
                  {lead.nextFollowUpAt ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
