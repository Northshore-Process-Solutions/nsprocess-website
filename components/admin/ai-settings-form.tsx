"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  saveAiIndustrySettings,
  saveAiProposalSettings,
  saveAiReplySettings,
} from "@/app/crm/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AppAiSettings } from "@/lib/app-ai";

export function AiSettingsForm({
  companyName,
  settings,
  industryPlaceholder,
}: {
  companyName: string;
  settings: AppAiSettings;
  industryPlaceholder: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        AI uses your company name from Company settings ({companyName}). Each
        feature below has its own instructions so proposal drafts and email
        replies stay independent.
      </p>
      <AiIndustryCard
        industry={settings.industry}
        industryPlaceholder={industryPlaceholder}
      />
      <AiProposalCard instructions={settings.proposalInstructions} />
      <AiReplyCard instructions={settings.replyInstructions} />
    </div>
  );
}

function AiIndustryCard({
  industry,
  industryPlaceholder,
}: {
  industry: string | null;
  industryPlaceholder: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAiIndustrySettings({
        industry: String(formData.get("industry") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setMessage("Shared AI context saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-base font-semibold tracking-tight">
        Shared AI context
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Used by proposal generation and email replies so both sound like your
        business.
      </p>

      <form action={onSave} className="mt-6 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">What you sell / industry</span>
          <textarea
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={industry ?? ""}
            maxLength={500}
            name="industry"
            placeholder={industryPlaceholder}
          />
          <span className="block text-xs text-muted-foreground">
            Example: residential HVAC install and service in the North Shore,
            MA area.
          </span>
        </label>

        <SaveFeedback error={error} message={message} />
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save shared context"}
        </Button>
      </form>
    </Card>
  );
}

function AiProposalCard({ instructions }: { instructions: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAiProposalSettings({
        proposalInstructions: String(
          formData.get("proposalInstructions") ?? "",
        ),
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setMessage("Proposal AI settings saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-base font-semibold tracking-tight">
        Proposal generation
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Applied only when drafting proposal scope and line items. Structure
        rules stay locked.
      </p>

      <form action={onSave} className="mt-6 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Proposal instructions</span>
          <textarea
            className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={instructions ?? ""}
            maxLength={4000}
            name="proposalInstructions"
            placeholder={
              "Optional. e.g. Prefer phase-based line items. Mention a 40% deposit. Leave unit prices blank when unsure. Keep scope high-level."
            }
          />
        </label>

        <SaveFeedback error={error} message={message} />
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save proposal AI"}
        </Button>
      </form>
    </Card>
  );
}

function AiReplyCard({ instructions }: { instructions: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAiReplySettings({
        replyInstructions: String(formData.get("replyInstructions") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setMessage("Email reply AI settings saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-base font-semibold tracking-tight">Email replies</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Applied only when optimizing outbound lead reply emails.
      </p>

      <form action={onSave} className="mt-6 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Reply instructions</span>
          <textarea
            className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={instructions ?? ""}
            maxLength={4000}
            name="replyInstructions"
            placeholder={
              "Optional. e.g. Warm but direct tone. Always offer a phone call. Sign off as the company first name only. Never mention pricing."
            }
          />
        </label>

        <SaveFeedback error={error} message={message} />
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save reply AI"}
        </Button>
      </form>
    </Card>
  );
}

function SaveFeedback({
  error,
  message,
}: {
  error: string | null;
  message: string | null;
}) {
  return (
    <>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}
    </>
  );
}
