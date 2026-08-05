import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { CalendarPanel } from "@/components/admin/calendar-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
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
    redirect("/admin/login");
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
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="calendar" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Calendar
          </h1>
          <p className="mt-2 text-muted-foreground">
            Booked consults, onsites, calls, and follow-ups in one place.
          </p>
        </div>
        <SignOutButton />
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
