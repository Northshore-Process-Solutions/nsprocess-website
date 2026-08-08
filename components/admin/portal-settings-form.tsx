"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { savePortalSettings } from "@/app/crm/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PortalSettingsForm({ portalName }: { portalName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await savePortalSettings({
        portalName: String(formData.get("portalName") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save portal settings.");
        return;
      }
      setMessage("Portal settings saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-8">
      <h3 className="text-base font-semibold tracking-tight">Portal</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Label shown in the CRM header and login screen.
      </p>

      <form action={onSave} className="mt-6 space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Portal label</span>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue={portalName}
            name="portalName"
            placeholder="e.g. NHS CRM"
            required
          />
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
          {pending ? "Saving…" : "Save portal settings"}
        </Button>
      </form>
    </Card>
  );
}
