"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  CalendarEventDialog,
  type CalendarLeadOption,
  type CalendarOrgOption,
} from "@/components/admin/calendar-event-dialog";
import { Button } from "@/components/ui/button";
import {
  addMonths,
  calendarEventTypeLabel,
  dayKey,
  formatEventTime,
  formatMonthLabel,
  getMonthGridDays,
  isSameDay,
  monthKey,
  startOfMonth,
  toDateTimeLocalValue,
  type CalendarEventType,
  type CalendarEventWithRelations,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

type CreateDefaults = {
  startsAt?: string;
  leadId?: string | null;
  organizationId?: string | null;
  title?: string;
  eventType?: CalendarEventType;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const typeStyles: Record<string, string> = {
  consult: "bg-indigo-100 text-indigo-900",
  onsite: "bg-teal-100 text-teal-900",
  call: "bg-sky-100 text-sky-900",
  follow_up: "bg-amber-100 text-amber-950",
  other: "bg-stone-100 text-stone-800",
};

export function CalendarPanel({
  month,
  events,
  leads,
  organizations,
  initialLeadId,
}: {
  month: Date;
  events: CalendarEventWithRelations[];
  leads: CalendarLeadOption[];
  organizations: CalendarOrgOption[];
  initialLeadId?: string | null;
}) {
  const router = useRouter();
  const monthStart = startOfMonth(month);
  const today = new Date();
  const days = useMemo(() => getMonthGridDays(monthStart), [monthStart]);

  const eventsByDay = useMemo(() => {
    return events.reduce<Record<string, CalendarEventWithRelations[]>>(
      (acc, event) => {
        const key = dayKey(new Date(event.starts_at));
        const current = acc[key] ?? [];
        current.push(event);
        acc[key] = current;
        return acc;
      },
      {},
    );
  }, [events]);

  const [dialogOpen, setDialogOpen] = useState(Boolean(initialLeadId));
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEventWithRelations | null>(null);
  const [createDefaults, setCreateDefaults] = useState<
    CreateDefaults | undefined
  >(() => {
    if (!initialLeadId) return undefined;
    const lead = leads.find((item) => item.id === initialLeadId);
    return {
      leadId: initialLeadId,
      organizationId: lead?.organization_id ?? null,
      title: lead ? `Consult — ${lead.business_name}` : "",
      eventType: "consult",
    };
  });

  const prevMonth = addMonths(monthStart, -1);
  const nextMonth = addMonths(monthStart, 1);

  function openCreate(day?: Date) {
    const lead = initialLeadId
      ? leads.find((item) => item.id === initialLeadId)
      : null;
    setMode("create");
    setSelectedEvent(null);
    setCreateDefaults({
      startsAt: day
        ? toDateTimeLocalValue(
            new Date(
              day.getFullYear(),
              day.getMonth(),
              day.getDate(),
              10,
              0,
            ).toISOString(),
          )
        : undefined,
      leadId: lead?.id ?? null,
      organizationId: lead?.organization_id ?? null,
      title: lead ? `Consult — ${lead.business_name}` : "",
      eventType: "consult",
    });
    setDialogOpen(true);
  }

  function openEdit(event: CalendarEventWithRelations) {
    setMode("edit");
    setSelectedEvent(event);
    setCreateDefaults(undefined);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button asChild size="icon" type="button" variant="outline">
            <Link
              aria-label="Previous month"
              href={`/admin/calendar?month=${monthKey(prevMonth)}`}
            >
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
          </Button>
          <Button asChild size="icon" type="button" variant="outline">
            <Link
              aria-label="Next month"
              href={`/admin/calendar?month=${monthKey(nextMonth)}`}
            >
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          </Button>
          <h2 className="ml-2 text-xl font-bold tracking-tight">
            {formatMonthLabel(monthStart)}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button asChild type="button" variant="outline">
            <Link href={`/admin/calendar?month=${monthKey(today)}`}>Today</Link>
          </Button>
          <Button onClick={() => openCreate()} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            Schedule
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid grid-cols-7 border-b border-border bg-muted/70">
          {WEEKDAYS.map((day) => (
            <div
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dayKey(day);
            const inMonth = day.getMonth() === monthStart.getMonth();
            const dayEvents = eventsByDay[key] ?? [];
            const isToday = isSameDay(day, today);

            return (
              <div
                className={cn(
                  "min-h-28 border-b border-r border-border p-2 align-top",
                  !inMonth && "bg-muted/20 text-muted-foreground",
                )}
                key={key}
              >
                <button
                  className="mb-2 flex w-full items-center justify-between rounded-lg text-left transition hover:bg-secondary/50"
                  onClick={() => openCreate(day)}
                  type="button"
                >
                  <span
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {day.getDate()}
                  </span>
                </button>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      className={cn(
                        "block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold",
                        typeStyles[event.event_type] ?? typeStyles.other,
                      )}
                      key={event.id}
                      onClick={() => openEdit(event)}
                      type="button"
                    >
                      {formatEventTime(event.starts_at)}{" "}
                      {calendarEventTypeLabel(event.event_type)}
                      {event.leads?.business_name
                        ? ` · ${event.leads.business_name}`
                        : ""}
                    </button>
                  ))}
                  {dayEvents.length > 3 ? (
                    <p className="px-1 text-[11px] font-medium text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="text-lg font-semibold tracking-tight">This month</h3>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No events scheduled. Click a day or use Schedule to book a consult
            or onsite.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <button
                  className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-left transition hover:bg-secondary/40"
                  onClick={() => openEdit(event)}
                  type="button"
                >
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {calendarEventTypeLabel(event.event_type)} ·{" "}
                      {new Date(event.starts_at).toLocaleString()}
                      {event.leads?.business_name
                        ? ` · ${event.leads.business_name}`
                        : ""}
                      {event.organizations?.name && !event.leads
                        ? ` · ${event.organizations.name}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      typeStyles[event.event_type] ?? typeStyles.other,
                    )}
                  >
                    {calendarEventTypeLabel(event.event_type)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CalendarEventDialog
        defaults={createDefaults}
        event={selectedEvent}
        leads={leads}
        mode={mode}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
        open={dialogOpen}
        organizations={organizations}
      />
    </div>
  );
}
