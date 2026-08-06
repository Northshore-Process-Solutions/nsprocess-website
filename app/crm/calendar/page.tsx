import { redirect } from "next/navigation";

import { CalendarPanel } from "@/components/admin/calendar-panel";
import {
  getMonthQueryRange,
  monthKey,
  parseMonthParam,
  type CalendarEventWithRelations,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

type CalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
    leadId?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const yearMonth = parseMonthParam(params?.month);
  const leadId = params?.leadId ?? null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/crm/login");
  }

  const { rangeStart, rangeEnd } = getMonthQueryRange(yearMonth);

  const [
    { data: eventsData, error: eventsError },
    { data: leadsData, error: leadsError },
    { data: orgsData, error: orgsError },
  ] = await Promise.all([
    supabase
      .from("calendar_events")
      .select(
        `
        *,
        leads (
          id,
          business_name,
          contact_name
        ),
        organizations (
          id,
          name
        )
      `,
      )
      .gte("starts_at", rangeStart)
      .lte("starts_at", rangeEnd)
      .order("starts_at", { ascending: true }),
    supabase
      .from("leads")
      .select("id, business_name, contact_name, organization_id")
      .order("business_name", { ascending: true }),
    supabase
      .from("organizations")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  if (eventsError) {
    throw new Error(`Failed to load calendar events: ${eventsError.message}`);
  }
  if (leadsError) {
    throw new Error(`Failed to load leads: ${leadsError.message}`);
  }
  if (orgsError) {
    throw new Error(`Failed to load organizations: ${orgsError.message}`);
  }

  const events = (eventsData ?? []) as CalendarEventWithRelations[];

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
        leads={leadsData ?? []}
        month={monthKey(yearMonth)}
        organizations={orgsData ?? []}
      />
    </main>
  );
}
