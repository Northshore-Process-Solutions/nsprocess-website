"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  saveAiIndustrySettings,
  saveAiProposalSettings,
  saveAiReplySettings,
  saveAiSpamSettings,
} from "@/app/crm/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AiIndustrySettingsForm({
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
      <form action={onSave} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">What you sell / industry</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2"
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
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}

export function AiProposalSettingsForm({
  instructions,
}: {
  instructions: string | null;
}) {
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
      <form action={onSave} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Proposal instructions</span>
          <textarea
            className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={instructions ?? ""}
            maxLength={4000}
            name="proposalInstructions"
            placeholder={
              "Optional. e.g. Prefer phase-based line items. Mention a 40% deposit. Leave unit prices blank when unsure. Keep scope high-level."
            }
          />
          <span className="block text-xs text-muted-foreground">
            Structure rules stay locked so drafts remain reliable.
          </span>
        </label>

        <SaveFeedback error={error} message={message} />
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}

export function AiReplySettingsForm({
  instructions,
}: {
  instructions: string | null;
}) {
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
      <form action={onSave} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Reply instructions</span>
          <textarea
            className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={instructions ?? ""}
            maxLength={4000}
            name="replyInstructions"
            placeholder={
              "Optional. e.g. Warm but direct tone. Always offer a phone call. Sign off with first name only. Never mention pricing."
            }
          />
        </label>

        <SaveFeedback error={error} message={message} />
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}

export function AiSpamSettingsForm({
  instructions,
}: {
  instructions: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAiSpamSettings({
        spamInstructions: String(formData.get("spamInstructions") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setMessage("Spam detection settings saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-8">
      <form action={onSave} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Spam detection instructions</span>
          <textarea
            className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={instructions ?? ""}
            maxLength={4000}
            name="spamInstructions"
            placeholder={
              "Optional. e.g. Flag SEO and link-building pitches. Ignore vague but local business inquiries. Treat info@ generic domains as suspicious unless the message is clearly legitimate."
            }
          />
          <span className="block text-xs text-muted-foreground">
            Applied when new inquiries arrive. Flags appear on the pipeline
            when AI thinks a lead is spam or advertising.
          </span>
        </label>

        <SaveFeedback error={error} message={message} />
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save"}
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
