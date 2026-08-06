"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { startDemoSession } from "@/app/demo/actions";
import { markDemoSkipEnd } from "@/components/demo/demo-session-flags";
import { Button } from "@/components/ui/button";

export function DemoIntakeForm() {
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

      // Hard navigation + session query busts client/CDN caches from prior demos.
      markDemoSkipEnd();
      const next = result.sessionId
        ? `/demo?s=${encodeURIComponent(result.sessionId)}`
        : `/demo?t=${Date.now()}`;
      window.location.assign(next);
    });
  }

  return (
    <div className="relative">
      {pending ? (
        <div
          aria-busy="true"
          aria-live="polite"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md bg-white/90 px-6 text-center backdrop-blur-[2px]"
          role="status"
        >
          <Loader2
            aria-hidden
            className="size-9 animate-spin text-slate-800"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Building your demo
            </p>
            <p className="mt-1 text-sm text-slate-600">
              This usually takes about 20–30 seconds. Hang tight.
            </p>
          </div>
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={onSubmit}
        {...(pending ? { inert: true } : {})}
      >
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
              disabled={pending}
              name="businessName"
              placeholder="North Shore Comfort HVAC"
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Contact name
            <input
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              disabled={pending}
              name="contactName"
              placeholder="Jordan Smith"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Industry
            <input
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              disabled={pending}
              name="industry"
              placeholder="HVAC, dental, accounting…"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Business size
            <select
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              defaultValue="5-15 employees"
              disabled={pending}
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
            disabled={pending}
            name="location"
            placeholder="Amesbury, MA"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          What do you do, and what’s hardest to keep organized?
          <textarea
            className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            disabled={pending}
            name="description"
            placeholder="We install and service residential HVAC. Leads come in from the website and referrals; tracking jobs from estimate to invoice gets messy."
            required
          />
        </label>

        <Button className="w-full sm:w-auto" disabled={pending} type="submit">
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Building…
            </span>
          ) : (
            "Build my demo"
          )}
        </Button>
      </form>
    </div>
  );
}
