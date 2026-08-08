import Link from "next/link";

import {
  PIPELINE_PHASES,
  type PipelinePhaseId,
} from "@/lib/pipeline-phases";
import { cn } from "@/lib/utils";

export type PipelinePhaseBarItem = {
  id: PipelinePhaseId;
  count: number;
  href: string;
  emphasize?: boolean;
};

export function PipelinePhaseBar({
  items,
  activePhase,
  clearHref,
}: {
  items: PipelinePhaseBarItem[];
  activePhase: PipelinePhaseId | null;
  clearHref: string;
}) {
  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <section className="mb-5">
      {/* Mobile: stacked cards — no forced horizontal scroll */}
      <ol className="grid grid-cols-2 gap-2 md:hidden">
        {PIPELINE_PHASES.map((phase) => {
          const item = byId.get(phase.id);
          if (!item) return null;
          const isActive = activePhase === phase.id;
          const emphasize = Boolean(item.emphasize) && !isActive;
          const href =
            isActive && phase.id !== "project" ? clearHref : item.href;

          return (
            <li
              className={cn(phase.id === "project" && "col-span-2")}
              key={phase.id}
            >
              <Link
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex min-h-16 flex-col justify-center rounded-md px-3 py-2.5 transition",
                  emphasize
                    ? "bg-lime-100 text-lime-950"
                    : "bg-slate-100 text-slate-900",
                  isActive && "bg-slate-900 text-white",
                )}
                href={href}
                title={phase.description}
              >
                <span
                  className={cn(
                    "text-[0.65rem] font-semibold uppercase tracking-wide",
                    isActive
                      ? "text-slate-300"
                      : emphasize
                        ? "text-lime-800"
                        : "text-slate-500",
                  )}
                >
                  {phase.label}
                </span>
                <span className="mt-0.5 text-xl font-semibold tabular-nums leading-none">
                  {item.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Desktop: chevron phase bar */}
      <div className="hidden overflow-x-auto pb-1 md:block">
        <ol className="flex min-w-[42rem] items-stretch gap-1">
          {PIPELINE_PHASES.map((phase, index) => {
            const item = byId.get(phase.id);
            if (!item) return null;

            const isFirst = index === 0;
            const isLast = index === PIPELINE_PHASES.length - 1;
            const isActive = activePhase === phase.id;
            const emphasize = Boolean(item.emphasize) && !isActive;
            const href =
              isActive && phase.id !== "project" ? clearHref : item.href;

            return (
              <li className="relative min-w-0 flex-1" key={phase.id}>
                <Link
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "relative flex h-full min-h-[4.25rem] flex-col justify-center px-3 py-2.5 transition",
                    !isFirst && "pl-5",
                    !isLast && "pr-4",
                    emphasize
                      ? "bg-lime-100 text-lime-950 hover:bg-lime-200/90"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200/90",
                    isActive && "bg-slate-900 text-white hover:bg-slate-900",
                  )}
                  href={href}
                  style={{ clipPath: chevronClip(isFirst, isLast) }}
                  title={phase.description}
                >
                  <span
                    className={cn(
                      "text-[0.65rem] font-semibold uppercase tracking-wide",
                      isActive
                        ? "text-slate-300"
                        : emphasize
                          ? "text-lime-800"
                          : "text-slate-500",
                    )}
                  >
                    {phase.label}
                  </span>
                  <span className="mt-0.5 text-xl font-semibold tabular-nums leading-none">
                    {item.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {activePhase && activePhase !== "project" ? (
        <div className="mt-3 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{phaseFilterCopy(activePhase)}</p>
          <Link
            className="shrink-0 text-xs font-semibold text-slate-900 underline-offset-2 hover:underline"
            href={clearHref}
          >
            Show all phases
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function chevronClip(isFirst: boolean, isLast: boolean) {
  if (isFirst) {
    return "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)";
  }
  if (isLast) {
    return "polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)";
  }
  return "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)";
}

function phaseFilterCopy(phase: Exclude<PipelinePhaseId, "project">) {
  switch (phase) {
    case "prospect":
      return "Showing prospects from new inquiry through proposal sent.";
    case "accepted":
      return "Showing accepted proposals waiting for an agreement.";
    case "contract":
      return "Showing leads with an agreement waiting to be signed.";
    case "deposit":
      return "Showing leads with an unpaid deposit invoice.";
  }
}
