import { redirect } from "next/navigation";

import { DemoShell } from "@/components/demo/demo-shell";
import { requireReadyDemoSession } from "@/lib/demo/session";

export const metadata = {
  title: "Demo Projects",
  robots: { index: false, follow: false },
};

export default async function DemoProjectsPage() {
  const { session } = await requireReadyDemoSession();
  if (!session?.seed) redirect("/demo");

  const seed = session.seed;

  return (
    <DemoShell businessName={seed.business.name}>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Projects
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Active jobs {seed.business.name} is delivering for customers.
        </p>
      </header>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
        {seed.projects.map((project) => (
          <li className="px-4 py-3" key={project.id}>
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
          </li>
        ))}
      </ul>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Upcoming events</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {seed.events.map((event) => (
            <li key={event.id}>
              <p className="font-medium text-slate-900">{event.title}</p>
              <p className="text-xs text-slate-500">
                {new Date(event.startsAt).toLocaleString()} · {event.eventType}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </DemoShell>
  );
}
