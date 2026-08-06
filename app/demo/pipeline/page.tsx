import Link from "next/link";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader } from "@/components/demo/demo-ui";
import { loadDemoSeed } from "@/lib/demo/data";
import { leadStageLabel } from "@/lib/leads";

export const metadata = {
  title: "Demo Pipeline",
  robots: { index: false, follow: false },
};

export default async function DemoPipelinePage() {
  const seed = await loadDemoSeed();

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`Customer inquiries for ${seed.business.name} — quotes, site visits, and jobs waiting to move forward.`}
        title="Pipeline"
      />

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
              <tr
                className="border-t border-slate-100 hover:bg-slate-50"
                key={lead.id}
              >
                <td className="px-3 py-2.5">
                  <Link
                    className="font-medium text-slate-900 hover:underline"
                    href={`/demo/pipeline/${lead.id}`}
                  >
                    {lead.businessName}
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {lead.message}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <p>{lead.contactName}</p>
                  <p className="text-xs text-slate-500">{lead.email}</p>
                </td>
                <td className="px-3 py-2.5">{leadStageLabel(lead.stage)}</td>
                <td className="px-3 py-2.5">{lead.nextFollowUpAt ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
