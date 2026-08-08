"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { contact } from "@/lib/site-data";

export function ContactForm({
  sent,
  error,
}: {
  sent: boolean;
  error: boolean;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action="/api/contact"
      aria-label="Free Process Review request form"
      className="relative space-y-5"
      method="post"
      onSubmit={() => setPending(true)}
    >
      {sent ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium leading-6 text-emerald-900"
        >
          Thanks. Your request was sent, and we&apos;ll follow up shortly.
        </div>
      ) : null}
      {error ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-900"
        >
          Something went wrong sending the form. Please email us at{" "}
          {contact.email}.
        </div>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor="hp_nsps_field">Leave blank</label>
        <input
          autoComplete="off"
          data-1p-ignore="true"
          data-form-type="other"
          data-lpignore="true"
          id="hp_nsps_field"
          name="hp_nsps_field"
          tabIndex={-1}
          type="text"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          First name
          <input
            className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            disabled={pending}
            name="firstName"
            placeholder="Jane"
            required
            type="text"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Last name
          <input
            className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            disabled={pending}
            name="lastName"
            placeholder="Smith"
            required
            type="text"
          />
        </label>
      </div>
      <label className="block space-y-2 text-sm font-semibold">
        Business name
        <input
          className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
          disabled={pending}
          name="business"
          placeholder="Your business"
          required
          type="text"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          Email
          <input
            className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            disabled={pending}
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Phone
          <input
            className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            disabled={pending}
            name="phone"
            placeholder="(978) 555-0123"
            type="tel"
          />
        </label>
      </div>
      <label className="block space-y-2 text-sm font-semibold">
        What is taking too much time right now?
        <textarea
          className="min-h-36 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-normal outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
          disabled={pending}
          name="message"
          placeholder="Tell us about paperwork, spreadsheets, scheduling, follow-up, reporting, or anything else that feels repetitive."
          required
        />
      </label>
      <Button
        aria-busy={pending}
        className="w-full"
        disabled={pending}
        size="lg"
        type="submit"
        variant="accent"
      >
        {pending ? "Sending…" : "Request My Free Process Review"}
      </Button>
      <p className="text-center text-sm leading-6 text-muted-foreground">
        No pressure. No gimmicks. Just practical business advice.
      </p>
    </form>
  );
}
