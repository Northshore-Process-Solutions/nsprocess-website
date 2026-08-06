"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { todayDateOnly } from "@/lib/billing";

type OrganizationOption = {
  id: string;
  name: string;
};

type StatementFormProps = {
  organizations: OrganizationOption[];
  defaultOrganizationId?: string | null;
};

export function StatementForm({
  organizations,
  defaultOrganizationId,
}: StatementFormProps) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(
    defaultOrganizationId &&
      organizations.some((org) => org.id === defaultOrganizationId)
      ? defaultOrganizationId
      : (organizations[0]?.id ?? ""),
  );
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
  const [to, setTo] = useState(todayDateOnly());

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId) return;

    const params = new URLSearchParams({
      organizationId,
      from,
      to,
    });
    router.push(`/crm/statements/view?${params.toString()}`);
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold lg:col-span-2">
          Business
          <select
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setOrganizationId(event.target.value)}
            required
            value={organizationId}
          >
            {organizations.length === 0 ? (
              <option value="">No businesses found</option>
            ) : null}
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold">
          From
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setFrom(event.target.value)}
            required
            type="date"
            value={from}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          To
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setTo(event.target.value)}
            required
            type="date"
            value={to}
          />
        </label>
      </section>

      <div className="flex justify-end">
        <Button disabled={!organizationId} type="submit" variant="accent">
          Generate statement
        </Button>
      </div>
    </form>
  );
}
