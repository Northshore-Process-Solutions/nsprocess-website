"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  createInvoice,
  markInvoicePaid,
  markInvoiceSent,
  updateInvoice,
  type InvoiceInput,
} from "@/app/admin/invoices/actions";
import { Button } from "@/components/ui/button";
import { computeTotals, formatMoney, type LineItemInput } from "@/lib/billing";
import {
  emptyInvoiceFormValues,
  INVOICE_STATUSES,
  INVOICE_TYPES,
  invoiceToFormValues,
  type InvoiceStatus,
  type InvoiceType,
  type InvoiceWithItems,
} from "@/lib/invoices";

type InvoiceEditorProps = {
  mode: "create" | "edit";
  initialInvoice?: InvoiceWithItems | null;
  defaults?: {
    title?: string;
    invoiceType?: InvoiceType;
    clientBusinessName?: string;
    clientContactName?: string | null;
    clientEmail?: string | null;
    clientPhone?: string | null;
    leadId?: string | null;
    organizationId?: string | null;
    agreementId?: string | null;
    proposalId?: string | null;
    projectId?: string | null;
    items?: LineItemInput[];
  };
};

export function InvoiceEditor({
  mode,
  initialInvoice = null,
  defaults,
}: InvoiceEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState(() =>
    mode === "edit" && initialInvoice
      ? invoiceToFormValues(initialInvoice)
      : emptyInvoiceFormValues(defaults),
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const totals = useMemo(() => {
    const parsedItems = values.items.map((item) => ({
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    }));
    return computeTotals(parsedItems);
  }, [values.items]);

  const balanceDue = useMemo(() => {
    const paid = Number(values.amountPaid) || 0;
    return Math.max(0, Math.round((totals.total - paid) * 100) / 100);
  }, [totals.total, values.amountPaid]);

  function updateField<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function updateItem(
    index: number,
    key: keyof LineItemInput,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
    setSaved(false);
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [
        ...current.items,
        { description: "", quantity: "1", unitPrice: "" },
      ],
    }));
    setSaved(false);
  }

  function removeItem(index: number) {
    setValues((current) => ({
      ...current,
      items:
        current.items.length <= 1
          ? current.items
          : current.items.filter((_, i) => i !== index),
    }));
    setSaved(false);
  }

  function toPayload(): InvoiceInput {
    return {
      title: values.title,
      invoiceType: values.invoiceType,
      status: values.status,
      agreementId: values.agreementId || null,
      proposalId: values.proposalId || null,
      leadId: values.leadId || null,
      organizationId: values.organizationId || null,
      projectId: values.projectId || null,
      clientBusinessName: values.clientBusinessName,
      clientContactName: values.clientContactName || undefined,
      clientEmail: values.clientEmail || undefined,
      clientPhone: values.clientPhone || undefined,
      issuedAt: values.issuedAt,
      dueAt: values.dueAt || undefined,
      notes: values.notes || undefined,
      amountPaid: values.amountPaid || undefined,
      items: values.items,
    };
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const payload = toPayload();
    const result =
      mode === "edit" && initialInvoice
        ? await updateInvoice(initialInvoice.id, payload)
        : await createInvoice(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to save invoice.");
      return;
    }

    setSaved(true);
    if (mode === "create" && result.id) {
      router.push(`/admin/invoices/${result.id}`);
      router.refresh();
      return;
    }

    router.refresh();
  }

  async function onMarkSent() {
    if (!initialInvoice) return;
    setSending(true);
    setError(null);

    const saveResult = await updateInvoice(initialInvoice.id, {
      ...toPayload(),
      status: "sent",
    });
    if (!saveResult.ok) {
      setSending(false);
      setError(saveResult.error ?? "Failed to save before sending.");
      return;
    }

    const result = await markInvoiceSent(initialInvoice.id);
    setSending(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to mark sent.");
      return;
    }

    updateField("status", "sent");
    setSaved(true);
    router.refresh();
  }

  async function onMarkPaid() {
    if (!initialInvoice) return;
    setPaying(true);
    setError(null);

    const saveResult = await updateInvoice(initialInvoice.id, toPayload());
    if (!saveResult.ok) {
      setPaying(false);
      setError(saveResult.error ?? "Failed to save before marking paid.");
      return;
    }

    const paidAmount = Number(values.amountPaid) || totals.total;
    const result = await markInvoicePaid(initialInvoice.id, paidAmount);
    setPaying(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to mark paid.");
      return;
    }

    updateField("status", "paid");
    updateField("amountPaid", String(paidAmount || totals.total));
    setSaved(true);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSave}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            href="/admin/invoices"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to Invoices
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            {mode === "create" ? "New invoice" : values.title || "Invoice"}
          </h1>
          {initialInvoice ? (
            <p className="mt-2 text-muted-foreground">
              {initialInvoice.invoice_number}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Draft line items, due date, and a printable PDF for the client.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {initialInvoice ? (
            <>
              <Button asChild type="button" variant="outline">
                <Link
                  href={`/admin/invoices/${initialInvoice.id}/pdf`}
                  target="_blank"
                >
                  <FileDown aria-hidden className="size-4" />
                  Open PDF
                </Link>
              </Button>
              <Button
                disabled={sending || values.status === "sent" || values.status === "paid"}
                onClick={onMarkSent}
                type="button"
                variant="outline"
              >
                {sending
                  ? "Marking…"
                  : values.status === "sent" || values.status === "paid"
                    ? "Already sent"
                    : "Mark sent"}
              </Button>
              <Button
                disabled={paying || values.status === "paid"}
                onClick={onMarkPaid}
                type="button"
                variant="outline"
              >
                {paying
                  ? "Marking…"
                  : values.status === "paid"
                    ? "Already paid"
                    : "Mark paid"}
              </Button>
            </>
          ) : null}
          <Button disabled={loading} type="submit" variant="accent">
            {loading ? "Saving…" : mode === "create" ? "Create draft" : "Save"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          Saved.
        </div>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold lg:col-span-2">
          Title
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("title", event.target.value)}
            required
            value={values.title}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Type
          <select
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) =>
              updateField("invoiceType", event.target.value as InvoiceType)
            }
            value={values.invoiceType}
          >
            {INVOICE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Status
          <select
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) =>
              updateField("status", event.target.value as InvoiceStatus)
            }
            value={values.status}
          >
            {INVOICE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Issued
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("issuedAt", event.target.value)}
            required
            type="date"
            value={values.issuedAt}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Due
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("dueAt", event.target.value)}
            type="date"
            value={values.dueAt}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Amount paid
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            min="0"
            onChange={(event) => updateField("amountPaid", event.target.value)}
            step="0.01"
            type="number"
            value={values.amountPaid}
          />
        </label>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:grid-cols-2">
        <h2 className="text-lg font-semibold lg:col-span-2">Client</h2>
        <label className="space-y-2 text-sm font-semibold">
          Business
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) =>
              updateField("clientBusinessName", event.target.value)
            }
            required
            value={values.clientBusinessName}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Contact
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) =>
              updateField("clientContactName", event.target.value)
            }
            value={values.clientContactName}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Email
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("clientEmail", event.target.value)}
            type="email"
            value={values.clientEmail}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Phone
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("clientPhone", event.target.value)}
            value={values.clientPhone}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Line items</h2>
          <Button onClick={addItem} type="button" variant="outline">
            <Plus aria-hidden className="size-4" />
            Add line
          </Button>
        </div>

        <div className="space-y-3">
          {values.items.map((item, index) => {
            const lineTotal =
              (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            return (
              <div
                className="grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_5rem_7rem_6rem_auto]"
                key={`item-${index}`}
              >
                <label className="space-y-1 text-xs font-semibold">
                  Description
                  <input
                    className="min-h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) =>
                      updateItem(index, "description", event.target.value)
                    }
                    required
                    value={item.description}
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold">
                  Qty
                  <input
                    className="min-h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    min="0"
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                    step="0.01"
                    type="number"
                    value={item.quantity}
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold">
                  Unit price
                  <input
                    className="min-h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    min="0"
                    onChange={(event) =>
                      updateItem(index, "unitPrice", event.target.value)
                    }
                    step="0.01"
                    type="number"
                    value={item.unitPrice}
                  />
                </label>
                <div className="space-y-1 text-xs font-semibold">
                  Total
                  <p className="flex min-h-10 items-center text-sm font-medium">
                    {formatMoney(lineTotal)}
                  </p>
                </div>
                <div className="flex items-end">
                  <Button
                    aria-label={`Remove line ${index + 1}`}
                    disabled={values.items.length <= 1}
                    onClick={() => removeItem(index)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-end gap-1 border-t border-border pt-4 text-sm">
          <p>
            <span className="text-muted-foreground">Subtotal / total:</span>{" "}
            <span className="font-semibold">{formatMoney(totals.total)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Amount paid:</span>{" "}
            <span className="font-semibold">
              {formatMoney(values.amountPaid)}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Balance due:</span>{" "}
            <span className="font-semibold">{formatMoney(balanceDue)}</span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <label className="block space-y-2 text-sm font-semibold">
          Notes
          <textarea
            className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Payment instructions or internal notes."
            value={values.notes}
          />
        </label>
      </section>
    </form>
  );
}
