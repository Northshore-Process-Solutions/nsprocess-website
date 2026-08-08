"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  clearBrandLogo,
  saveBrandSettings,
  uploadBrandLogo,
} from "@/app/crm/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AppBrand } from "@/lib/app-brand";

export function BrandSettingsForm({ brand }: { brand: AppBrand }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveBrandSettings({
        companyName: String(formData.get("companyName") ?? ""),
        portalName: String(formData.get("portalName") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        serviceArea: String(formData.get("serviceArea") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save settings.");
        return;
      }
      setMessage("Brand settings saved.");
      router.refresh();
    });
  }

  function onUpload(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await uploadBrandLogo(formData);
      if (!result.ok) {
        setError(result.error ?? "Upload failed.");
        return;
      }
      if (result.logoUrl) setLogoUrl(result.logoUrl);
      setMessage("Logo updated.");
      router.refresh();
    });
  }

  function onClearLogo() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await clearBrandLogo();
      if (!result.ok) {
        setError(result.error ?? "Could not remove logo.");
        return;
      }
      setLogoUrl(null);
      setMessage("Logo removed.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">Company</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown in the CRM header, login screen, proposals, and share links.
        </p>

        <form action={onSave} className="mt-6 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Company name</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              defaultValue={brand.companyName}
              name="companyName"
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Portal label</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              defaultValue={brand.portalName}
              name="portalName"
              placeholder="e.g. NHS CRM"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Tagline</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              defaultValue={brand.tagline ?? ""}
              name="tagline"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Phone</span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                defaultValue={brand.phone ?? ""}
                name="phone"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Email</span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                defaultValue={brand.email ?? ""}
                name="email"
                type="email"
              />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Service area</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              defaultValue={brand.serviceArea ?? ""}
              name="serviceArea"
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
            {pending ? "Saving…" : "Save brand settings"}
          </Button>
        </form>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">Logo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used in the CRM header and on printable documents. PNG or SVG with a
          transparent background works best.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-28 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
            {logoUrl ? (
              // Remote Supabase storage URLs; avoid next/image domain config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Current logo"
                className="max-h-16 max-w-24 object-contain"
                src={logoUrl}
              />
            ) : (
              <span className="px-2 text-center text-xs text-slate-400">
                No logo
              </span>
            )}
          </div>

          <form action={onUpload} className="flex flex-wrap items-end gap-3">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Upload image</span>
              <input
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                className="block w-full text-sm"
                name="logo"
                required
                type="file"
              />
            </label>
            <Button disabled={pending} type="submit" variant="outline">
              {pending ? "Uploading…" : "Upload logo"}
            </Button>
          </form>

          {logoUrl ? (
            <Button
              disabled={pending}
              onClick={onClearLogo}
              type="button"
              variant="ghost"
            >
              Remove logo
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
