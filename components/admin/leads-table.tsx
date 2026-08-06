"use client";

import Link from "next/link";
import { CalendarDays, Eye, Mail } from "lucide-react";

import { ActionHoverTooltip } from "@/components/admin/action-hover-tooltip";
import {
  MobileDataCard,
  MobileDataField,
  ResponsiveDataList,
} from "@/components/admin/responsive-data-list";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import {
  formatActivityWhen,
  latestEmailActivity,
  type ActivityRow,
} from "@/lib/activities";
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
  activitiesByLeadId?: Record<string, ActivityRow[]>;
  onView: (row: LeadRow) => void;
  onReply?: (row: LeadRow) => void;
};

function EmailPreview({ activity }: { activity: ActivityRow | null }) {
  if (!activity) {
    return <p className="mt-1 text-sm text-muted-foreground">None logged</p>;
  }

  return (
    <div className="mt-1">
      <p className="truncate text-sm font-semibold">
        {activity.subject || "Email"}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatActivityWhen(activity.occurred_at)}
      </p>
    </div>
  );
}

function LeadEmailAction({
  lead,
  activities,
  onReply,
}: {
  lead: LeadRow;
  activities: ActivityRow[];
  onReply?: (row: LeadRow) => void;
}) {
  const lastSent = latestEmailActivity(activities, "sent");
  const lastReceived = latestEmailActivity(activities, "received");
  const hasEmail = Boolean(lastSent || lastReceived);

  if (!onReply) return null;

  return (
    <ActionHoverTooltip
      content={
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Last sent
            </p>
            <EmailPreview activity={lastSent} />
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Last received
            </p>
            <EmailPreview activity={lastReceived} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Click to compose an email.
          </p>
        </>
      }
    >
      <Button
        aria-label={`Email ${lead.business_name}`}
        className={cn(hasEmail && "border-accent/40 text-accent")}
        onClick={() => onReply(lead)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Mail aria-hidden className="size-4" />
      </Button>
    </ActionHoverTooltip>
  );
}

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

function LeadViewAction({
  lead,
  onView,
}: {
  lead: LeadRow;
  onView: (row: LeadRow) => void;
}) {
  const message = lead.message?.trim();

  return (
    <ActionHoverTooltip
      content={
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Lead preview
            </p>
            <p className="mt-1 text-base font-bold tracking-tight">
              {lead.business_name}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {lead.contact_name}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <PreviewField
              label="Stage"
              value={
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                    stageStyles[lead.stage],
                  )}
                >
                  {leadStageLabel(lead.stage)}
                </span>
              }
            />
            <PreviewField
              label="Source"
              value={leadSourceLabel(lead.source)}
            />
            <PreviewField
              label="Created"
              value={new Date(lead.created_at).toLocaleDateString()}
            />
            <PreviewField
              label="Follow-up"
              value={lead.next_follow_up_at || "—"}
            />
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <PreviewField
              label="Inquiry"
              value={
                <p className="line-clamp-3 font-normal leading-5 text-foreground/90">
                  {message || "No inquiry message."}
                </p>
              }
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Click to open full lead.
          </p>
        </>
      }
      width={288}
    >
      <Button
        aria-label={`View ${lead.business_name}`}
        onClick={() => onView(lead)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Eye aria-hidden className="size-4" />
      </Button>
    </ActionHoverTooltip>
  );
}

function LeadCalendarAction({
  lead,
  events,
}: {
  lead: LeadRow;
  events: CalendarEventRow[];
}) {
  const { href } = usePortal();
  const upcoming = events.filter(
    (event) => new Date(event.starts_at).getTime() >= Date.now(),
  );
  const previewEvents = (upcoming.length > 0 ? upcoming : events).slice(0, 5);
  const hasEvents = events.length > 0;

  return (
    <ActionHoverTooltip
      content={
        <>
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
        </>
      }
    >
      <Button
        asChild
        aria-label={`Schedule event for ${lead.business_name}`}
        className={cn(hasEvents && "border-accent/40 text-accent")}
        size="icon"
        type="button"
        variant="outline"
      >
        <Link href={href(`/calendar?leadId=${lead.id}`)}>
          <CalendarDays aria-hidden className="size-4" />
        </Link>
      </Button>
    </ActionHoverTooltip>
  );
}

export function LeadsTable({
  rows,
  eventsByLeadId = {},
  activitiesByLeadId = {},
  onView,
  onReply,
}: LeadsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">No leads yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Website Process Review requests and manual leads will show up here.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveDataList
      cards={rows.map((row) => (
        <MobileDataCard
          actions={
            <>
              <LeadEmailAction
                activities={activitiesByLeadId[row.id] ?? []}
                lead={row}
                onReply={onReply}
              />
              <LeadCalendarAction
                events={eventsByLeadId[row.id] ?? []}
                lead={row}
              />
              <LeadViewAction lead={row} onView={onView} />
            </>
          }
          badge={
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                stageStyles[row.stage],
              )}
            >
              {leadStageLabel(row.stage)}
            </span>
          }
          key={row.id}
          meta={
            <>
              <span>{leadSourceLabel(row.source)}</span>
              <span>{new Date(row.created_at).toLocaleDateString()}</span>
            </>
          }
          title={row.business_name}
        >
          <MobileDataField label="Contact">
            <span className="block">
              {row.contact_name}
              <a
                className="mt-0.5 block text-xs font-normal text-accent hover:underline"
                href={`mailto:${row.email}`}
              >
                {row.email}
              </a>
              {row.phone ? (
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {row.phone}
                </span>
              ) : null}
            </span>
          </MobileDataField>
        </MobileDataCard>
      ))}
      table={
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
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
                        <LeadEmailAction
                          activities={activitiesByLeadId[row.id] ?? []}
                          lead={row}
                          onReply={onReply}
                        />
                        <LeadCalendarAction
                          events={eventsByLeadId[row.id] ?? []}
                          lead={row}
                        />
                        <LeadViewAction lead={row} onView={onView} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  );
}
