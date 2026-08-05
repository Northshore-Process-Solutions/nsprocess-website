import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProjectsTable } from "@/components/admin/projects-table";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import {
  isNextActionOverdue,
  isProjectPastTarget,
  resolveProjectNextAction,
  type ProjectTaskRow,
  type ProjectWithOrganization,
} from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const nowIso = new Date().toISOString();

  const [
    { data, error },
    { data: tasksData, error: tasksError },
    { data: eventsData, error: eventsError },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `
        *,
        organizations (
          id,
          name
        )
      `,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("project_tasks")
      .select("id, project_id, title, is_done, due_at, sort_order, created_at")
      .eq("is_done", false),
    supabase
      .from("calendar_events")
      .select("id, project_id, title, starts_at, ends_at")
      .not("project_id", "is", null)
      .gte("starts_at", nowIso),
  ]);

  if (error) {
    throw new Error(`Failed to load projects: ${error.message}`);
  }
  if (tasksError) {
    throw new Error(`Failed to load tasks: ${tasksError.message}`);
  }
  if (eventsError) {
    throw new Error(`Failed to load events: ${eventsError.message}`);
  }

  const tasksByProject = (
    (tasksData ?? []) as ProjectTaskRow[]
  ).reduce<Record<string, ProjectTaskRow[]>>((acc, task) => {
    const current = acc[task.project_id] ?? [];
    current.push(task);
    acc[task.project_id] = current;
    return acc;
  }, {});

  const eventsByProject = (
    (eventsData ?? []) as Array<{
      id: string;
      project_id: string;
      title: string;
      starts_at: string;
      ends_at: string | null;
    }>
  ).reduce<
    Record<
      string,
      Array<{ title: string; starts_at: string; ends_at: string | null }>
    >
  >((acc, event) => {
    const current = acc[event.project_id] ?? [];
    current.push(event);
    acc[event.project_id] = current;
    return acc;
  }, {});

  const projects = ((data ?? []) as ProjectWithOrganization[]).map(
    (project) => {
      const projectTasks = tasksByProject[project.id] ?? [];
      const projectEvents = eventsByProject[project.id] ?? [];
      const next = resolveProjectNextAction({
        tasks: projectTasks,
        events: projectEvents,
      });

      return {
        ...project,
        open_task_count: projectTasks.length,
        next_action: next.label,
        next_action_at: next.at,
        next_action_source: next.source,
      };
    },
  );

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
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="projects" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Projects
          </h1>
          <p className="mt-2 text-muted-foreground">
            Lightweight delivery workspace after deposit — tasks, schedule, and
            next actions in one place.
          </p>
        </div>
        <SignOutButton />
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
