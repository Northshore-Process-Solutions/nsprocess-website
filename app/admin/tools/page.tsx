import { Layers3, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { ToolsPanel } from "@/components/admin/tools-panel";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import type { ToolRow } from "@/lib/tools";

type ToolsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

const filters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Trial", value: "trial" },
  { label: "Inactive", value: "inactive" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Replacing", value: "replacing" },
];

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  const statusFilter = params?.status ?? "all";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load tools: ${error.message}`);
  }

  const tools = (data ?? []) as ToolRow[];
  const rows =
    statusFilter === "all"
      ? tools
      : tools.filter((tool) => tool.status === statusFilter);

  const activeCount = tools.filter((tool) => tool.status === "active").length;
  const monthlySpend = tools
    .filter(
      (tool) =>
        tool.status === "active" &&
        tool.billing_cadence === "monthly" &&
        tool.billing_amount !== null,
    )
    .reduce((sum, tool) => sum + Number(tool.billing_amount ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <AdminNav current="stack" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Stack
          </h1>
          <p className="mt-2 text-muted-foreground">
            Internal tools and vendors that keep North Shore Process Solutions
            running.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Layers3 aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Active tools</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <WalletCards aria-hidden className="size-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">
                Known monthly spend
              </p>
              <p className="text-2xl font-bold">${monthlySpend.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Stack filters" className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = statusFilter === filter.value;
          const href =
            filter.value === "all"
              ? "/admin/tools"
              : `/admin/tools?status=${filter.value}`;

          return (
            <a
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              }
              href={href}
              key={filter.value}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      <ToolsPanel rows={rows} />
    </main>
  );
}
