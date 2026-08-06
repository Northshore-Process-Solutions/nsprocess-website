"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createProjectTask,
  deleteProjectTask,
  toggleProjectTask,
} from "@/app/crm/projects/actions";
import { Button } from "@/components/ui/button";
import type { ProjectTaskRow } from "@/lib/projects";
import { cn } from "@/lib/utils";

type ProjectTasksPanelProps = {
  projectId: string;
  tasks: ProjectTaskRow[];
};

function isTaskOverdue(task: ProjectTaskRow) {
  if (task.is_done || !task.due_at) return false;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return task.due_at < todayKey;
}

export function ProjectTasksPanel({ projectId, tasks }: ProjectTasksPanelProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openTasks = tasks.filter((task) => !task.is_done);
  const doneTasks = tasks.filter((task) => task.is_done);

  async function onAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createProjectTask(projectId, {
      title,
      dueAt: dueAt || undefined,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to add task.");
      return;
    }

    setTitle("");
    setDueAt("");
    router.refresh();
  }

  async function onToggle(task: ProjectTaskRow) {
    setBusyId(task.id);
    setError(null);
    const result = await toggleProjectTask(task.id, projectId, !task.is_done);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error ?? "Failed to update task.");
      return;
    }
    router.refresh();
  }

  async function onDelete(task: ProjectTaskRow) {
    const confirmed = window.confirm(`Delete “${task.title}”?`);
    if (!confirmed) return;

    setBusyId(task.id);
    setError(null);
    const result = await deleteProjectTask(task.id, projectId);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error ?? "Failed to delete task.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {openTasks.length} open
            {doneTasks.length > 0 ? ` · ${doneTasks.length} done` : ""}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={onAdd}>
        <input
          className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task…"
          required
          value={title}
        />
        <input
          className="min-h-11 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-40"
          onChange={(event) => setDueAt(event.target.value)}
          type="date"
          value={dueAt}
        />
        <Button disabled={loading} type="submit" variant="accent">
          <Plus aria-hidden className="size-4" />
          {loading ? "Adding…" : "Add"}
        </Button>
      </form>

      {tasks.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="font-semibold">No tasks yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Break delivery into concrete next steps.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {[...openTasks, ...doneTasks].map((task) => {
            const overdue = isTaskOverdue(task);
            return (
              <li
                className="flex items-start gap-3 rounded-2xl border border-border bg-background px-3 py-3"
                key={task.id}
              >
                <button
                  aria-label={
                    task.is_done ? "Mark task incomplete" : "Mark task complete"
                  }
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border transition",
                    task.is_done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-border bg-card text-transparent hover:border-accent",
                  )}
                  disabled={busyId === task.id}
                  onClick={() => onToggle(task)}
                  type="button"
                >
                  <Check aria-hidden className="size-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-medium",
                      task.is_done && "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.due_at ? (
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        overdue
                          ? "font-semibold text-red-700"
                          : "text-muted-foreground",
                      )}
                    >
                      Due{" "}
                      {new Date(`${task.due_at}T12:00:00`).toLocaleDateString()}
                      {overdue ? " · Overdue" : ""}
                    </p>
                  ) : null}
                </div>
                <Button
                  aria-label="Delete task"
                  disabled={busyId === task.id}
                  onClick={() => onDelete(task)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
