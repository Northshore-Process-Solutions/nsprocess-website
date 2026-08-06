import { CalendarPanel } from "@/components/admin/calendar-panel";
import { loadDemoCrmData } from "@/lib/demo/data";
import {
  getMonthQueryRange,
  monthKey,
  parseMonthParam,
  type CalendarEventWithRelations,
} from "@/lib/calendar";

export const metadata = {
  title: "Demo Calendar",
  robots: { index: false, follow: false },
};

type DemoCalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
    leadId?: string;
  }>;
};

export default async function DemoCalendarPage({
  searchParams,
}: DemoCalendarPageProps) {
  const params = await searchParams;
  const yearMonth = parseMonthParam(params?.month);
  const leadId = params?.leadId ?? null;
  const data = await loadDemoCrmData();
  const { rangeStart, rangeEnd } = getMonthQueryRange(yearMonth);

  const events = data.events
    .filter(
      (event) => event.starts_at >= rangeStart && event.starts_at <= rangeEnd,
    )
    .map((event) => {
      const lead = event.lead_id
        ? data.leads.find((row) => row.id === event.lead_id)
        : null;
      const org = event.organization_id
        ? data.organizations.find((row) => row.id === event.organization_id)
        : null;

      return {
        ...event,
        leads: lead
          ? {
              id: lead.id,
              business_name: lead.business_name,
              contact_name: lead.contact_name,
            }
          : null,
        organizations: org ? { id: org.id, name: org.name } : null,
      } satisfies CalendarEventWithRelations;
    });

  const leads = data.leads.map((lead) => ({
    id: lead.id,
    business_name: lead.business_name,
    contact_name: lead.contact_name,
    organization_id: lead.organization_id,
  }));

  const organizations = data.organizations.map((org) => ({
    id: org.id,
    name: org.name,
  }));

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Booked consults, onsites, calls, and follow-ups in one place.
        </p>
      </header>

      <CalendarPanel
        events={events}
        initialLeadId={leadId}
        leads={leads}
        month={monthKey(yearMonth)}
        organizations={organizations}
      />
    </main>
  );
}
