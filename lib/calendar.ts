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

export type YearMonth = {
  year: number;
  /** 1-12 */
  month: number;
};

const CALENDAR_TIMEZONE = "America/New_York";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/** Current calendar month in Eastern time (stable on server and client). */
export function currentYearMonth(
  timeZone = CALENDAR_TIMEZONE,
  now = new Date(),
): YearMonth {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

export function monthKey(value: YearMonth | Date) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}`;
  }
  return `${value.year}-${pad2(value.month)}`;
}

export function parseMonthParam(value?: string | null): YearMonth {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return currentYearMonth();
  }

  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) {
    return currentYearMonth();
  }

  return { year, month };
}

export function addMonths(value: YearMonth, amount: number): YearMonth {
  const absolute = value.year * 12 + (value.month - 1) + amount;
  const year = Math.floor(absolute / 12);
  const month = (absolute % 12) + 1;
  return { year, month };
}

/** Local calendar date for the 1st of the month (client display only). */
export function yearMonthToLocalDate(value: YearMonth) {
  return new Date(value.year, value.month - 1, 1);
}

/**
 * Inclusive UTC bounds covering the visible month grid with padding so
 * local-timezone edge days are still loaded.
 */
export function getMonthQueryRange(value: YearMonth) {
  const dayMs = 24 * 60 * 60 * 1000;
  const monthStartUtc = Date.UTC(value.year, value.month - 1, 1);
  const nextMonth = addMonths(value, 1);
  const nextMonthStartUtc = Date.UTC(nextMonth.year, nextMonth.month - 1, 1);

  return {
    rangeStart: new Date(monthStartUtc - 7 * dayMs).toISOString(),
    rangeEnd: new Date(nextMonthStartUtc + 7 * dayMs - 1).toISOString(),
  };
}

/** Days for a Sunday-start month grid (includes leading/trailing days). */
export function getMonthGridDays(value: YearMonth) {
  const first = yearMonthToLocalDate(value);
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
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatMonthLabel(value: YearMonth) {
  return yearMonthToLocalDate(value).toLocaleDateString(undefined, {
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
