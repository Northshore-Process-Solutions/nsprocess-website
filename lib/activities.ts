export type ActivityType = "email" | "call" | "meeting" | "note" | "other";

export type ActivityRow = {
  id: string;
  organization_id: string | null;
  lead_id: string | null;
  activity_type: ActivityType;
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
    subject: "",
    body: "",
    occurredAt: new Date().toISOString().slice(0, 16),
  };
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
