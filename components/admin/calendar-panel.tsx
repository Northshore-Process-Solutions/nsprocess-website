"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ActionHoverTooltip } from "@/components/admin/action-hover-tooltip";
import {
  CalendarEventDialog,
  type CalendarLeadOption,
  type CalendarOrgOption,
} from "@/components/admin/calendar-event-dialog";
import { Button } from "@/components/ui/button";
import {
  addMonths,
  calendarEventTypeLabel,
  currentYearMonth,
  dayKey,
  formatEventTime,
  formatMonthLabel,
  getMonthGridDays,
  isSameDay,
  monthKey,
  parseMonthParam,
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

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function formatEventWhen(event: CalendarEventWithRelations) {
  const start = new Date(event.starts_at);
  const dateLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = formatEventTime(event.starts_at);
  if (!event.ends_at) {
    return `${dateLabel} · ${startTime}`;
  }
  return `${dateLabel} · ${startTime} – ${formatEventTime(event.ends_at)}`;
}

function CalendarEventHoverPreview({
  event,
}: {
  event: CalendarEventWithRelations;
}) {
  const notes = event.notes?.trim();
  const contact = event.leads?.contact_name?.trim();
  const business = event.leads?.business_name?.trim();
  const organization = event.organizations?.name?.trim();

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Event preview
        </p>
        <p className="mt-1 text-base font-bold tracking-tight">{event.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {calendarEventTypeLabel(event.event_type)}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <PreviewField label="When" value={formatEventWhen(event)} />
        <PreviewField
          label="Location"
          value={event.location?.trim() || "—"}
        />
        <PreviewField
          label="Business"
          value={business || organization || "—"}
        />
        <PreviewField label="Contact" value={contact || "—"} />
      </div>

      {notes ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Notes
          </p>
          <p className="mt-1 line-clamp-4 text-sm leading-5 text-muted-foreground">
            {notes}
          </p>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">Click to edit.</p>
    </>
  );
}

export function CalendarPanel({
  month,
  events,
  leads,
  organizations,
  initialLeadId,
}: {
  month: string;
  events: CalendarEventWithRelations[];
  leads: CalendarLeadOption[];
  organizations: CalendarOrgOption[];
  initialLeadId?: string | null;
}) {
  const router = useRouter();
  const yearMonth = useMemo(() => parseMonthParam(month), [month]);
  const today = new Date();
  const todayMonth = currentYearMonth();
  const days = useMemo(() => getMonthGridDays(yearMonth), [yearMonth]);

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

  const prevMonth = addMonths(yearMonth, -1);
  const nextMonth = addMonths(yearMonth, 1);

  function goToMonth(target: { year: number; month: number }) {
    setDialogOpen(false);
    router.push(`/crm/calendar?month=${monthKey(target)}`);
  }

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
          <Button
            aria-label="Previous month"
            onClick={() => goToMonth(prevMonth)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <Button
            aria-label="Next month"
            onClick={() => goToMonth(nextMonth)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronRight aria-hidden className="size-4" />
          </Button>
          <h2 className="ml-2 text-xl font-bold tracking-tight">
            {formatMonthLabel(yearMonth)}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => goToMonth(todayMonth)}
            type="button"
            variant="outline"
          >
            Today
          </Button>
          <Button onClick={() => openCreate()} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Month grid — desktop / tablet only */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:block">
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
            const inMonth = day.getMonth() === yearMonth.month - 1;
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
                    <ActionHoverTooltip
                      content={<CalendarEventHoverPreview event={event} />}
                      key={event.id}
                      width={288}
                    >
                      <button
                        className={cn(
                          "block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold",
                          typeStyles[event.event_type] ?? typeStyles.other,
                        )}
                        onClick={() => openEdit(event)}
                        type="button"
                      >
                        {formatEventTime(event.starts_at)}{" "}
                        {calendarEventTypeLabel(event.event_type)}
                        {event.leads?.business_name
                          ? ` · ${event.leads.business_name}`
                          : ""}
                      </button>
                    </ActionHoverTooltip>
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

      <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <h3 className="text-lg font-semibold tracking-tight md:hidden">
          {formatMonthLabel(yearMonth)}
        </h3>
        <h3 className="hidden text-lg font-semibold tracking-tight md:block">
          This month
        </h3>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No events scheduled. Use Schedule to book a consult or onsite.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <ActionHoverTooltip
                  content={<CalendarEventHoverPreview event={event} />}
                  width={288}
                >
                  <button
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border px-4 py-3.5 text-left transition hover:bg-secondary/40"
                    onClick={() => openEdit(event)}
                    type="button"
                  >
                    <div className="min-w-0">
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
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                        typeStyles[event.event_type] ?? typeStyles.other,
                      )}
                    >
                      {calendarEventTypeLabel(event.event_type)}
                    </span>
                  </button>
                </ActionHoverTooltip>
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
