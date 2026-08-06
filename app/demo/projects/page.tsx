import Link from "next/link";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoPageHeader } from "@/components/demo/demo-ui";
import { loadDemoSeed } from "@/lib/demo/data";

export const metadata = {
  title: "Demo Projects",
  robots: { index: false, follow: false },
};

export default async function DemoProjectsPage() {
  const seed = await loadDemoSeed();

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        description={`Active jobs ${seed.business.name} is delivering for customers.`}
        title="Projects"
      />

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
        {seed.projects.map((project) => (
          <li key={project.id}>
            <Link
              className="block px-4 py-3 hover:bg-slate-50"
              href={`/demo/projects/${project.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {project.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {project.businessName}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{project.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{project.nextAction}</p>
            </Link>
          </li>
        ))}
      </ul>
    </DemoShell>
  );
}
