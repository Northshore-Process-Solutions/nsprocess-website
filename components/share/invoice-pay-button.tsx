"use client";

import { useState, useTransition } from "react";

import { startInvoiceCheckout } from "@/app/share/invoices/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/billing";

export function InvoicePayButton({
  token,
  balanceDue,
  disabled = false,
}: {
  token: string;
  balanceDue: number;
  disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPay() {
    setError(null);
    startTransition(async () => {
      const result = await startInvoiceCheckout(token);
      if (!result.ok || !result.checkoutUrl) {
        setError(result.error ?? "Could not start payment.");
        return;
      }
      window.location.assign(result.checkoutUrl);
    });
  }

  return (
    <div className="space-y-3">
      <Button
        className="w-full sm:w-auto"
        disabled={disabled || pending || balanceDue <= 0}
        onClick={onPay}
        type="button"
        variant="accent"
      >
        {pending ? "Redirecting…" : `Pay ${formatMoney(balanceDue)}`}
      </Button>
      <p className="text-xs text-slate-500">
        Pay by card or US bank account (ACH). Bank transfers usually clear in a
        few business days.
      </p>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
