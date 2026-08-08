"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveAiSettings } from "@/app/crm/settings/actions";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAiSettings({
        industry: String(formData.get("industry") ?? ""),
        customInstructions: String(formData.get("customInstructions") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save AI settings.");
        return;
      }
      setMessage("AI settings saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">AI features</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Guide proposal drafting and reply suggestions. Company name comes from
        brand settings ({companyName}). The base structure rules stay locked so
        drafts stay reliable.
      </p>

      <form action={onSave} className="mt-6 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">What you sell / industry</span>
          <textarea
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={settings.industry ?? ""}
            maxLength={500}
            name="industry"
            placeholder={industryPlaceholder}
          />
          <span className="block text-xs text-muted-foreground">
            Example: residential HVAC install and service in the North Shore,
            MA area.
          </span>
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Custom instructions</span>
          <textarea
            className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={settings.customInstructions ?? ""}
            maxLength={4000}
            name="customInstructions"
            placeholder={
              "Optional. e.g. Prefer phase-based line items. Mention a 40% deposit. Never invent exact prices — leave unit prices blank when unsure. Use a warm but direct tone."
            }
          />
          <span className="block text-xs text-muted-foreground">
            Appended to proposal and reply prompts. Keep it short and specific.
          </span>
        </label>

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

        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save AI settings"}
        </Button>
      </form>
    </Card>
  );
}
