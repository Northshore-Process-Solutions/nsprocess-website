"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import {
  updateProject,
  type ProjectInput,
} from "@/app/admin/projects/actions";
import { Button } from "@/components/ui/button";
import {
  PROJECT_STATUSES,
  projectStatusLabel,
  type ProjectWithOrganization,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  planning: "bg-sky-50 text-sky-800 border-sky-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-900 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

type ProjectDetailProps = {
  project: ProjectWithOrganization;
};

export function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [startedAt, setStartedAt] = useState(project.started_at ?? "");
  const [notes, setNotes] = useState(project.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const payload: ProjectInput = {
      name,
      status,
      startedAt: startedAt || undefined,
      notes: notes || undefined,
    };

    const result = await updateProject(project.id, payload);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to save project.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          href="/admin/projects"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to Projects
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {project.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
              statusStyles[project.status] ?? statusStyles.active,
            )}
          >
            {projectStatusLabel(project.status)}
          </span>
          {project.organizations ? (
            <Link
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-accent hover:underline"
              href={`/admin/organizations/${project.organizations.id}`}
            >
              {project.organizations.name}
            </Link>
          ) : null}
        </div>
      </div>

      <form
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-lg font-semibold">Project details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Delivery work after deposit — update status as the engagement
            progresses.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
            {error}
          </div>
        ) : null}
        {saved ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
            Project saved.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">
            Name
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold">
            Status
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
              value={status}
            >
              {PROJECT_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold">
            Started
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setStartedAt(event.target.value)}
              type="date"
              value={startedAt}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold sm:col-span-2">
            Notes
            <textarea
              className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <Button disabled={loading} type="submit" variant="accent">
            {loading ? "Saving…" : "Save project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
