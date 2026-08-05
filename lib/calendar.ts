export type CalendarEventType =
  | "consult"
  | "onsite"
  | "call"
  | "follow_up"
  | "other";

export type CalendarEventRow = {
  id: string;
  organization_id: string | null;
  lead_id: string | null;
  title: string;
  event_type: CalendarEventType;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEventWithRelations = CalendarEventRow & {
  leads?: {
    id: string;
    business_name: string;
    contact_name: string;
  } | null;
  organizations?: {
    id: string;
    name: string;
  } | null;
};

export const CALENDAR_EVENT_TYPES: Array<{
  value: CalendarEventType;
  label: string;
}> = [
  { value: "consult", label: "Consult" },
  { value: "onsite", label: "Onsite" },
  { value: "call", label: "Call" },
  { value: "follow_up", label: "Follow-up" },
  { value: "other", label: "Other" },
];

export function calendarEventTypeLabel(type: CalendarEventType | string) {
  return (
    CALENDAR_EVENT_TYPES.find((item) => item.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

export function toDateTimeLocalValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function emptyCalendarEventFormValues(defaults?: {
  startsAt?: string;
  leadId?: string | null;
  organizationId?: string | null;
  title?: string;
  eventType?: CalendarEventType;
}) {
  const startDate = defaults?.startsAt
    ? new Date(defaults.startsAt)
    : (() => {
        const date = new Date();
        date.setMinutes(0, 0, 0);
        date.setHours(date.getHours() + 1);
        return date;
      })();

  const safeStart = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
  const endDate = new Date(safeStart);
  endDate.setHours(endDate.getHours() + 1);

  return {
    title: defaults?.title ?? "",
    eventType: defaults?.eventType ?? ("consult" as CalendarEventType),
    startsAt: toDateTimeLocalValue(safeStart.toISOString()),
    endsAt: toDateTimeLocalValue(endDate.toISOString()),
    location: "",
    notes: "",
    leadId: defaults?.leadId ?? "",
    organizationId: defaults?.organizationId ?? "",
  };
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function monthKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function parseMonthParam(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return startOfMonth(new Date());
  }

  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/** Days for a Sunday-start month grid (includes leading/trailing days). */
export function getMonthGridDays(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
