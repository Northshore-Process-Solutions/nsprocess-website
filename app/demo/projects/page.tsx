import { ProjectsTable } from "@/components/admin/projects-table";
import { loadDemoCrmData } from "@/lib/demo/data";
import {
  isNextActionOverdue,
  isProjectPastTarget,
} from "@/lib/projects";

export const metadata = {
  title: "Demo Projects",
  robots: { index: false, follow: false },
};

export default async function DemoProjectsPage() {
  const data = await loadDemoCrmData();
  const projects = data.projects;

  const inProgress = projects.filter(
    (project) => project.status === "active" || project.status === "planning",
  ).length;
  const overdueNextActions = projects.filter((project) =>
    isNextActionOverdue(project),
  ).length;
  const pastTarget = projects.filter((project) =>
    isProjectPastTarget(project),
  ).length;

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Projects
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Lightweight delivery workspace after deposit — tasks, schedule, and
          next actions in one place.
        </p>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Total projects</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {projects.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
          <p className="text-sm text-muted-foreground">In progress</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{inProgress}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Overdue next actions</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {overdueNextActions}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Past target end</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{pastTarget}</p>
        </div>
      </section>

      <ProjectsTable rows={projects} />
    </main>
  );
}
