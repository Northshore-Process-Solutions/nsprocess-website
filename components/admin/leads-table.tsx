"use client";

import Link from "next/link";
import { CalendarDays, Eye, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  calendarEventTypeLabel,
  formatEventTime,
  type CalendarEventRow,
} from "@/lib/calendar";
import {
  leadSourceLabel,
  leadStageLabel,
  type LeadRow,
  type LeadStage,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

const stageStyles: Record<LeadStage, string> = {
  new_inquiry: "bg-sky-50 text-sky-800 border-sky-200",
  follow_up: "bg-cyan-50 text-cyan-800 border-cyan-200",
  review_booked: "bg-indigo-50 text-indigo-800 border-indigo-200",
  review_completed: "bg-violet-50 text-violet-800 border-violet-200",
  proposal_sent: "bg-amber-50 text-amber-900 border-amber-200",
  deposit_received: "bg-teal-50 text-teal-800 border-teal-200",
  won: "bg-emerald-50 text-emerald-800 border-emerald-200",
  lost: "bg-red-50 text-red-800 border-red-200",
};

type LeadsTableProps = {
  rows: LeadRow[];
  eventsByLeadId?: Record<string, CalendarEventRow[]>;
  onView: (row: LeadRow) => void;
  onReply: (row: LeadRow) => void;
};

function LeadCalendarAction({
  lead,
  events,
}: {
  lead: LeadRow;
  events: CalendarEventRow[];
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placeBelow: boolean;
  } | null>(null);

  const upcoming = events.filter(
    (event) => new Date(event.starts_at).getTime() >= Date.now(),
  );
  const previewEvents = (upcoming.length > 0 ? upcoming : events).slice(0, 5);
  const hasEvents = events.length > 0;

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = 256;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    );
    const placeBelow = rect.top < 140;

    setCoords({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left,
      placeBelow,
    });
  }

  useEffect(() => {
    if (!open) return;

    updatePosition();
    function handleReposition() {
      updatePosition();
    }

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  const tooltip =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[80] w-64 rounded-2xl border border-border bg-card p-3 text-left shadow-card"
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.placeBelow ? "none" : "translateY(-100%)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {upcoming.length > 0 ? "Upcoming events" : "Booked events"}
            </p>
            {previewEvents.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No events yet. Click to schedule.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {previewEvents.map((event) => (
                  <li key={event.id}>
                    <p className="truncate text-sm font-semibold">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {calendarEventTypeLabel(event.event_type)} ·{" "}
                      {new Date(event.starts_at).toLocaleDateString()}{" "}
                      {formatEventTime(event.starts_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {events.length > previewEvents.length ? (
              <p className="mt-2 text-xs text-muted-foreground">
                +{events.length - previewEvents.length} more
              </p>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onFocus={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseEnter={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      ref={triggerRef}
    >
      <Button
        asChild
        aria-label={`Schedule event for ${lead.business_name}`}
        className={cn(hasEvents && "border-accent/40 text-accent")}
        size="icon"
        type="button"
        variant="outline"
      >
        <Link href={`/admin/calendar?leadId=${lead.id}`}>
          <CalendarDays aria-hidden className="size-4" />
        </Link>
      </Button>
      {tooltip}
    </div>
  );
}

export function LeadsTable({
  rows,
  eventsByLeadId = {},
  onView,
  onReply,
}: LeadsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No leads in this stage</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Website Process Review requests and manual leads will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-muted/70 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Business</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Stage</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className="border-t border-border align-top transition hover:bg-secondary/40"
              key={row.id}
            >
              <td className="px-4 py-4">
                <div className="font-semibold">{row.business_name}</div>
              </td>
              <td className="px-4 py-4">
                <div className="font-medium">{row.contact_name}</div>
                <a
                  className="mt-1 block text-xs text-accent hover:underline"
                  href={`mailto:${row.email}`}
                >
                  {row.email}
                </a>
                <div className="mt-1 text-xs text-muted-foreground">
                  {row.phone || "—"}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {new Date(row.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                {leadSourceLabel(row.source)}
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                    stageStyles[row.stage],
                  )}
                >
                  {leadStageLabel(row.stage)}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <Button
                    aria-label={`Email ${row.business_name}`}
                    onClick={() => onReply(row)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Mail aria-hidden className="size-4" />
                  </Button>
                  <LeadCalendarAction
                    events={eventsByLeadId[row.id] ?? []}
                    lead={row}
                  />
                  <Button
                    aria-label={`View ${row.business_name}`}
                    onClick={() => onView(row)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Eye aria-hidden className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
