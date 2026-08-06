"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startDemoSession } from "@/app/demo/actions";
import { markDemoSkipEnd } from "@/components/demo/demo-session-flags";
import { Button } from "@/components/ui/button";

export function DemoIntakeForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await startDemoSession(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not build the demo.");
        return;
      }

      // Bust the App Router client cache for /demo (otherwise the previous
      // session's RSC payload can flash/stick after End demo → rebuild).
      markDemoSkipEnd();
      const next = result.sessionId
        ? `/demo?s=${encodeURIComponent(result.sessionId)}`
        : "/demo";
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Business name
          <input
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            name="businessName"
            placeholder="North Shore Comfort HVAC"
            required
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Contact name
          <input
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            name="contactName"
            placeholder="Jordan Smith"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Industry
          <input
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            name="industry"
            placeholder="HVAC, dental, accounting…"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Business size
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            defaultValue="5-15 employees"
            name="size"
          >
            <option>Solo / owner-operator</option>
            <option>2-5 employees</option>
            <option>5-15 employees</option>
            <option>15-50 employees</option>
            <option>50+ employees</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        Location
        <input
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          defaultValue="North Shore, MA"
          name="location"
          placeholder="Amesbury, MA"
        />
      </label>

      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        What do you do, and what’s hardest to keep organized?
        <textarea
          className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          name="description"
          placeholder="We install and service residential HVAC. Leads come in from the website and referrals; tracking jobs from estimate to invoice gets messy."
          required
        />
      </label>

      <Button className="w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? "Building your demo…" : "Build my demo"}
      </Button>

      {pending ? (
        <p className="text-sm text-slate-500">
          We’re putting together a private demo for you — just a moment.
        </p>
      ) : null}
    </form>
  );
}
