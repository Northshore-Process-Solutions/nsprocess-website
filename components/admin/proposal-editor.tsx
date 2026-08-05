"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileDown,
  FileSignature,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { draftProposalScope } from "@/app/admin/ai/actions";
import {
  createProposal,
  markProposalSent,
  updateProposal,
  type ProposalInput,
} from "@/app/admin/proposals/actions";
import { Button } from "@/components/ui/button";
import {
  computeProposalTotals,
  emptyProposalFormValues,
  formatProposalMoney,
  PROPOSAL_STATUSES,
  proposalToFormValues,
  type ProposalItemInput,
  type ProposalStatus,
  type ProposalWithItems,
} from "@/lib/proposals";

type ProposalEditorProps = {
  mode: "create" | "edit";
  initialProposal?: ProposalWithItems | null;
  defaults?: {
    clientBusinessName?: string;
    clientContactName?: string | null;
    clientEmail?: string | null;
    clientPhone?: string | null;
    leadId?: string | null;
    organizationId?: string | null;
    title?: string;
  };
};

export function ProposalEditor({
  mode,
  initialProposal = null,
  defaults,
}: ProposalEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState(() =>
    mode === "edit" && initialProposal
      ? proposalToFormValues(initialProposal)
      : emptyProposalFormValues(defaults),
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const totals = useMemo(() => {
    const parsedItems = values.items.map((item) => ({
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    }));
    const deposit =
      values.depositPercent.trim() === ""
        ? null
        : Number(values.depositPercent);
    return computeProposalTotals(
      parsedItems,
      Number.isNaN(deposit as number) ? null : deposit,
    );
  }, [values.items, values.depositPercent]);

  function updateField<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function updateItem(
    index: number,
    key: keyof ProposalItemInput,
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

  function toPayload(): ProposalInput {
    return {
      title: values.title,
      status: values.status,
      leadId: values.leadId || null,
      organizationId: values.organizationId || null,
      clientBusinessName: values.clientBusinessName,
      clientContactName: values.clientContactName || undefined,
      clientEmail: values.clientEmail || undefined,
      clientPhone: values.clientPhone || undefined,
      issuedAt: values.issuedAt,
      validUntil: values.validUntil || undefined,
      scopeSummary: values.scopeSummary || undefined,
      terms: values.terms || undefined,
      notes: values.notes || undefined,
      depositPercent: values.depositPercent || undefined,
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
      mode === "edit" && initialProposal
        ? await updateProposal(initialProposal.id, payload)
        : await createProposal(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to save proposal.");
      return;
    }

    setSaved(true);
    if (mode === "create" && result.id) {
      router.push(`/admin/proposals/${result.id}`);
      router.refresh();
      return;
    }

    router.refresh();
  }

  async function onDraftScope() {
    setDrafting(true);
    setError(null);
    setSaved(false);

    const result = await draftProposalScope({
      businessName: values.clientBusinessName,
      contactName: values.clientContactName,
      title: values.title,
      notes: values.notes,
      existingScope: values.scopeSummary,
    });

    setDrafting(false);

    if (!result.ok || !result.text) {
      setError(result.error ?? "Failed to draft scope.");
      return;
    }

    updateField("scopeSummary", result.text);
  }

  async function onMarkSent() {
    if (!initialProposal) return;
    setSending(true);
    setError(null);

    // Persist current edits first
    const saveResult = await updateProposal(initialProposal.id, {
      ...toPayload(),
      status: "sent",
    });
    if (!saveResult.ok) {
      setSending(false);
      setError(saveResult.error ?? "Failed to save before sending.");
      return;
    }

    const result = await markProposalSent(initialProposal.id);
    setSending(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to mark sent.");
      return;
    }

    updateField("status", "sent");
    setSaved(true);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSave}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            href="/admin/proposals"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to Proposals
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {mode === "create" ? "New proposal" : values.title || "Proposal"}
          </h1>
          {initialProposal ? (
            <p className="mt-2 text-muted-foreground">
              {initialProposal.proposal_number}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Draft scope, pricing, and a printable PDF for the client.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {initialProposal ? (
            <>
              <Button asChild type="button" variant="outline">
                <Link
                  href={`/admin/proposals/${initialProposal.id}/pdf`}
                  target="_blank"
                >
                  <FileDown aria-hidden className="size-4" />
                  Open PDF
                </Link>
              </Button>
              <Button asChild type="button" variant="outline">
                <Link
                  href={`/admin/agreements/new?proposalId=${initialProposal.id}`}
                >
                  <FileSignature aria-hidden className="size-4" />
                  Create agreement
                </Link>
              </Button>
              <Button
                disabled={sending || values.status === "sent"}
                onClick={onMarkSent}
                type="button"
                variant="outline"
              >
                {sending
                  ? "Marking…"
                  : values.status === "sent"
                    ? "Already sent"
                    : "Mark sent"}
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
          Status
          <select
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) =>
              updateField("status", event.target.value as ProposalStatus)
            }
            value={values.status}
          >
            {PROPOSAL_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Deposit %
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            inputMode="decimal"
            max="100"
            min="0"
            onChange={(event) =>
              updateField("depositPercent", event.target.value)
            }
            step="1"
            type="number"
            value={values.depositPercent}
          />
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
          Valid until
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("validUntil", event.target.value)}
            type="date"
            value={values.validUntil}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Scope summary</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tip: put consult notes in Internal notes below, then draft with
              AI.
            </p>
          </div>
          <Button
            disabled={drafting}
            onClick={onDraftScope}
            type="button"
            variant="outline"
          >
            <Sparkles aria-hidden className="size-4" />
            {drafting ? "Drafting…" : "Draft with AI"}
          </Button>
        </div>
        <textarea
          className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => updateField("scopeSummary", event.target.value)}
          placeholder="What we will do, outcomes, and boundaries."
          value={values.scopeSummary}
        />
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
                    {formatProposalMoney(lineTotal)}
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
            <span className="font-semibold">
              {formatProposalMoney(totals.total)}
            </span>
          </p>
          {totals.depositAmount !== null ? (
            <p>
              <span className="text-muted-foreground">
                Deposit ({values.depositPercent}%):
              </span>{" "}
              <span className="font-semibold">
                {formatProposalMoney(totals.depositAmount)}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          Terms
          <textarea
            className="min-h-40 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("terms", event.target.value)}
            value={values.terms}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Internal notes
          <textarea
            className="min-h-40 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Not shown on the PDF."
            value={values.notes}
          />
        </label>
      </section>
    </form>
  );
}
