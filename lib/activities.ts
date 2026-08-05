export type ActivityType = "email" | "call" | "meeting" | "note" | "other";
export type EmailDirection = "sent" | "received";

export type ActivityRow = {
  id: string;
  organization_id: string | null;
  lead_id: string | null;
  activity_type: ActivityType;
  email_direction: EmailDirection | null;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
};

export const ACTIVITY_TYPES: Array<{
  value: ActivityType;
  label: string;
}> = [
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
  { value: "other", label: "Other" },
];

export function activityTypeLabel(type: ActivityType | string) {
  return (
    ACTIVITY_TYPES.find((item) => item.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

export function emptyActivityFormValues() {
  return {
    activityType: "note" as ActivityType,
    emailDirection: "sent" as EmailDirection,
    subject: "",
    body: "",
    occurredAt: new Date().toISOString().slice(0, 16),
  };
}

export function latestEmailActivity(
  activities: ActivityRow[],
  direction: EmailDirection,
) {
  return (
    activities
      .filter(
        (activity) =>
          activity.activity_type === "email" &&
          (activity.email_direction ?? "sent") === direction,
      )
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime(),
      )[0] ?? null
  );
}

export function formatActivityWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** datetime-local value from an ISO timestamp */
export function toDateTimeLocalValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return emptyActivityFormValues().occurredAt;
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
