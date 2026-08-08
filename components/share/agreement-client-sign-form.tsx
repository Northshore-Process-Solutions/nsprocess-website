"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signSharedAgreement } from "@/app/share/agreements/actions";
import { Button } from "@/components/ui/button";

type AgreementClientSignFormProps = {
  token: string;
  alreadySigned: boolean;
  signerName?: string | null;
  signedAt?: string | null;
};

export function AgreementClientSignForm({
  token,
  alreadySigned,
  signerName,
  signedAt,
}: AgreementClientSignFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);

    if (!agreed) {
      setLoading(false);
      setError("Confirm that you agree to the terms before signing.");
      return;
    }

    const result = await signSharedAgreement({
      token,
      signerName: name,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Could not record your signature.");
      return;
    }

    router.refresh();
  }

  if (alreadySigned) {
    return (
      <section className="mx-auto mt-6 max-w-[8.5in] rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-soft sm:mt-8 sm:p-6">
        <h2 className="text-lg font-semibold text-emerald-950">
          Agreement signed
        </h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          Thank you
          {signerName ? (
            <>
              , <span className="font-semibold">{signerName}</span>
            </>
          ) : null}
          . We&apos;ve received your signature
          {signedAt
            ? ` on ${new Date(signedAt).toLocaleString()}`
            : ""}
          . We&apos;ll follow up with the deposit invoice next.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto mt-6 max-w-[8.5in] rounded-2xl border border-border bg-card p-5 shadow-soft sm:mt-8 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Sign this agreement
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review the agreement above, then type your full legal name to sign.
        </p>

        <label className="mt-4 block space-y-2 text-sm font-semibold">
          Full name
          <input
            autoComplete="name"
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            required
            value={name}
          />
        </label>

        <label className="mt-4 flex items-start gap-3 text-sm">
          <input
            checked={agreed}
            className="mt-1 size-5 shrink-0 accent-slate-900"
            onChange={(event) => setAgreed(event.target.checked)}
            type="checkbox"
          />
          <span className="font-normal text-muted-foreground">
            I have read this agreement and agree to the scope, terms, and
            investment described above. Typing my name constitutes my electronic
            signature.
          </span>
        </label>

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
        ) : null}

        <div className="mt-4 hidden sm:block">
          <Button
            disabled={loading || !name.trim() || !agreed}
            onClick={submit}
            type="button"
            variant="accent"
          >
            {loading ? "Signing…" : "Sign agreement"}
          </Button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <Button
          className="w-full"
          disabled={loading || !name.trim() || !agreed}
          onClick={submit}
          type="button"
          variant="accent"
        >
          {loading ? "Signing…" : "Sign agreement"}
        </Button>
      </div>
    </>
  );
}
