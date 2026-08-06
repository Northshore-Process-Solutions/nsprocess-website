import { calendarEventTypeLabel, type CalendarEventType } from "@/lib/calendar";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/** UTC timestamp in ICS basic format: 20260806T153000Z */
export function toIcsUtc(date: Date) {
  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
    "T",
    pad2(date.getUTCHours()),
    pad2(date.getUTCMinutes()),
    pad2(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function foldIcsLine(line: string) {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  return chunks.join("\r\n");
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\n");
}

export type CalendarInviteInput = {
  uid: string;
  title: string;
  eventType: CalendarEventType;
  startsAt: Date;
  endsAt: Date;
  location?: string | null;
  notes?: string | null;
  organizerEmail: string;
  organizerName?: string;
  attendeeEmail: string;
  attendeeName?: string | null;
  sequence?: number;
};

/** Build a METHOD:REQUEST VCALENDAR payload for Outlook / most clients. */
export function buildCalendarInviteIcs(input: CalendarInviteInput) {
  const organizerName = input.organizerName ?? "North Shore Process Solutions";
  const descriptionParts = [
    `${calendarEventTypeLabel(input.eventType)} with North Shore Process Solutions`,
    input.notes?.trim() ? input.notes.trim() : null,
  ].filter(Boolean);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//North Shore Process Solutions//CRM//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(input.startsAt)}`,
    `DTEND:${toIcsUtc(input.endsAt)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(descriptionParts.join("\n\n"))}`,
    input.location?.trim()
      ? `LOCATION:${escapeIcsText(input.location.trim())}`
      : null,
    `ORGANIZER;CN=${escapeIcsText(organizerName)}:mailto:${input.organizerEmail}`,
    `ATTENDEE;CN=${escapeIcsText(input.attendeeName?.trim() || input.attendeeEmail)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${input.attendeeEmail}`,
    "STATUS:CONFIRMED",
    `SEQUENCE:${input.sequence ?? 0}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => Boolean(line));

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function formatMeetingWhen(startsAt: Date, endsAt: Date) {
  const dateLabel = startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
  const startLabel = startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
  const endLabel = endsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
  return `${dateLabel}\n${startLabel} – ${endLabel}`;
}
