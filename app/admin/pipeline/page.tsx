import { ClipboardList, Flame } from "lucide-react";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { LeadsPanel } from "@/components/admin/leads-panel";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import { LEAD_STAGES, type LeadRow, type LeadStage } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

type PipelinePageProps = {
  searchParams?: Promise<{
    stage?: string;
  }>;
};

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const params = await searchParams;
  const stageFilter = params?.stage ?? "all";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load leads: ${error.message}`);
  }

  const leads = (data ?? []) as LeadRow[];
  const rows =
    stageFilter === "all"
      ? leads
      : leads.filter((lead) => lead.stage === stageFilter);

  const openCount = leads.filter(
    (lead) => lead.stage !== "won" && lead.stage !== "lost",
  ).length;
  const newInquiryCount = leads.filter(
    (lead) => lead.stage === "new_inquiry",
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="pipeline" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Pipeline
          </h1>
          <p className="mt-2 text-muted-foreground">
            Free Process Review leads from your website and manual follow-up.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <ClipboardList aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Open leads</p>
              <p className="text-2xl font-bold">{openCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Flame aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">New inquiries</p>
              <p className="text-2xl font-bold">{newInquiryCount}</p>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Pipeline filters" className="mb-5 flex flex-wrap gap-2">
        <a
          className={
            stageFilter === "all"
              ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          }
          href="/admin/pipeline"
        >
          All
        </a>
        {LEAD_STAGES.map((stage) => {
          const active = stageFilter === stage.value;
          return (
            <a
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={`/admin/pipeline?stage=${stage.value as LeadStage}`}
              key={stage.value}
            >
              {stage.label}
            </a>
          );
        })}
      </nav>

      <LeadsPanel rows={rows} />
    </main>
  );
}
