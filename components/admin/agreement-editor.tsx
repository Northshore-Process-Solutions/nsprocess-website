"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  FileDown,
  Mail,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { draftAgreementScope } from "@/app/crm/ai/actions";
import {
  createAgreement,
  markAgreementSigned,
  updateAgreement,
  type AgreementInput,
} from "@/app/crm/agreements/actions";
import { draftDemoAgreementScope } from "@/app/demo/ai/actions";
import {
  ensureAgreementShareLink,
  sendAgreementShareEmail,
} from "@/app/share/agreements/actions";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/components/portal/portal-provider";
import { agreementSharePath } from "@/lib/agreement-share";
import {
  AGREEMENT_STATUSES,
  agreementStatusLabel,
  agreementToFormValues,
  emptyAgreementFormValues,
  type AgreementStatus,
  type AgreementWithItems,
} from "@/lib/agreements";
import {
  computeLineTotal,
  computeTotals,
  formatMoney,
  type LineItemInput,
} from "@/lib/billing";

type AgreementEditorProps = {
  mode: "create" | "edit";
  initialAgreement?: AgreementWithItems | null;
  defaults?: Parameters<typeof emptyAgreementFormValues>[0];
};

export function AgreementEditor({
  mode,
  initialAgreement = null,
  defaults,
}: AgreementEditorProps) {
  const router = useRouter();
  const { href, isDemo } = usePortal();
  const [values, setValues] = useState(() =>
    mode === "edit" && initialAgreement
      ? agreementToFormValues(initialAgreement)
      : emptyAgreementFormValues(defaults),
  );
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [signing, setSigning] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [shareUrlPreview, setShareUrlPreview] = useState<string | null>(null);

  const totals = useMemo(() => {
    const parsedItems = values.items.map((item) => ({
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    }));
    return computeTotals(parsedItems);
  }, [values.items]);

  const depositAmount = useMemo(() => {
    const deposit =
      values.depositPercent.trim() === ""
        ? null
        : Number(values.depositPercent);
    if (deposit === null || Number.isNaN(deposit)) return null;
    return Math.round(totals.total * (deposit / 100) * 100) / 100;
  }, [totals.total, values.depositPercent]);

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

  function toPayload(): AgreementInput {
    return {
      title: values.title,
      status: values.status,
      proposalId: values.proposalId || null,
      leadId: values.leadId || null,
      organizationId: values.organizationId || null,
      clientBusinessName: values.clientBusinessName,
      clientContactName: values.clientContactName || undefined,
      clientEmail: values.clientEmail || undefined,
      clientPhone: values.clientPhone || undefined,
      issuedAt: values.issuedAt,
      scopeSummary: values.scopeSummary || undefined,
      terms: values.terms || undefined,
      notes: values.notes || undefined,
      depositPercent: values.depositPercent || undefined,
      signerName: values.signerName || undefined,
      items: values.items,
    };
  }

  async function onDraftScope() {
    setDrafting(true);
    setError(null);
    setSaved(false);

    const draftInput = {
      businessName: values.clientBusinessName,
      contactName: values.clientContactName,
      title: values.title,
      notes: values.notes,
      existingScope: values.scopeSummary,
      existingItems: values.items,
    };

    const result = isDemo
      ? await draftDemoAgreementScope(draftInput)
      : await draftAgreementScope(draftInput);

    setDrafting(false);

    if (!result.ok || !result.text) {
      setError(result.error ?? "Failed to draft scope.");
      return;
    }

    setValues((current) => ({
      ...current,
      scopeSummary: result.text!,
      items:
        result.items && result.items.length > 0
          ? result.items
          : current.items,
    }));
    setSaved(false);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (isDemo) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    const payload = toPayload();
    const result =
      mode === "edit" && initialAgreement
        ? await updateAgreement(initialAgreement.id, payload)
        : await createAgreement(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to save agreement.");
      return;
    }

    setSaved(true);
    if (mode === "create" && result.id) {
      router.push(`/crm/agreements/${result.id}`);
      router.refresh();
      return;
    }

    router.refresh();
  }

  async function onMarkSigned() {
    if (!initialAgreement) return;
    setSigning(true);
    setError(null);

    const saveResult = await updateAgreement(initialAgreement.id, {
      ...toPayload(),
      status: "signed",
      signerName: values.signerName,
    });
    if (!saveResult.ok) {
      setSigning(false);
      setError(saveResult.error ?? "Failed to save before signing.");
      return;
    }

    const result = await markAgreementSigned(
      initialAgreement.id,
      values.signerName,
    );
    setSigning(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to mark signed.");
      return;
    }

    updateField("status", "signed");
    setSaved(true);
    router.refresh();
  }

  async function onCopyShareLink() {
    if (!initialAgreement || isDemo) return;
    setSharing(true);
    setError(null);
    setShareNotice(null);

    const result = await ensureAgreementShareLink(initialAgreement.id);
    setSharing(false);

    if (!result.ok || !result.token) {
      setError(result.error ?? "Could not create share link.");
      return;
    }

    const url = `${window.location.origin}${agreementSharePath(result.token)}`;
    setShareUrlPreview(url);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareNotice("Client signing link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareNotice("Copy this link and send it to the client:");
    }
  }

  async function onEmailShareLink() {
    if (!initialAgreement || isDemo) return;
    setEmailing(true);
    setError(null);
    setShareNotice(null);

    const result = await sendAgreementShareEmail(initialAgreement.id);
    setEmailing(false);

    if (!result.ok) {
      setError(result.error ?? "Could not email the link.");
      if (result.token) {
        setShareUrlPreview(
          `${window.location.origin}${agreementSharePath(result.token)}`,
        );
      }
      return;
    }

    if (result.token) {
      setShareUrlPreview(
        `${window.location.origin}${agreementSharePath(result.token)}`,
      );
    }
    updateField("status", "sent");
    setShareNotice(
      "Email sent to the client with a link to review and sign.",
    );
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSave}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            href={href("/agreements")}
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to Agreements
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            {mode === "create" ? "New agreement" : values.title || "Agreement"}
          </h1>
          {initialAgreement ? (
            <p className="mt-2 text-muted-foreground">
              {initialAgreement.agreement_number}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Binding contract after the proposal is accepted — client signs,
              then you invoice the deposit.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {initialAgreement ? (
            <>
              <Button asChild type="button" variant="outline">
                <Link
                  href={href(`/agreements/${initialAgreement.id}/pdf`)}
                  target="_blank"
                >
                  <FileDown aria-hidden className="size-4" />
                  Open PDF
                </Link>
              </Button>
              {!isDemo ? (
                <>
                  <Button
                    disabled={sharing || values.status === "signed"}
                    onClick={onCopyShareLink}
                    type="button"
                    variant="outline"
                  >
                    {copied ? (
                      <Check aria-hidden className="size-4" />
                    ) : (
                      <Copy aria-hidden className="size-4" />
                    )}
                    {sharing
                      ? "Preparing…"
                      : copied
                        ? "Copied"
                        : "Copy link"}
                  </Button>
                  <Button
                    disabled={
                      emailing ||
                      !values.clientEmail.trim() ||
                      values.status === "signed"
                    }
                    onClick={onEmailShareLink}
                    title={
                      values.clientEmail.trim()
                        ? "Email the client a link to sign"
                        : "Add a client email first"
                    }
                    type="button"
                    variant="outline"
                  >
                    <Mail aria-hidden className="size-4" />
                    {emailing ? "Sending…" : "Email link"}
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <Link
                      href={href(
                        `/invoices/new?agreementId=${initialAgreement.id}&mode=deposit`,
                      )}
                    >
                      <Receipt aria-hidden className="size-4" />
                      Deposit invoice
                    </Link>
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <Link
                      href={href(
                        `/invoices/new?agreementId=${initialAgreement.id}&mode=full`,
                      )}
                    >
                      Full invoice
                    </Link>
                  </Button>
                  <Button
                    disabled={signing || values.status === "signed"}
                    onClick={onMarkSigned}
                    type="button"
                    variant="outline"
                  >
                    {signing
                      ? "Marking…"
                      : values.status === "signed"
                        ? "Already signed"
                        : "Mark signed"}
                  </Button>
                </>
              ) : null}
            </>
          ) : null}
          {!isDemo ? (
            <Button disabled={loading} type="submit" variant="accent">
              {loading ? "Saving…" : "Save"}
            </Button>
          ) : null}
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
      {shareNotice ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-950">
          {shareNotice}
          {shareUrlPreview ? (
            <p className="mt-2 break-all font-normal text-sky-900/80">
              {shareUrlPreview}
            </p>
          ) : null}
        </div>
      ) : null}
      {initialAgreement?.signed_at ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-semibold">
            Signed
            {initialAgreement.signer_name
              ? ` by ${initialAgreement.signer_name}`
              : ""}
            {` · ${new Date(initialAgreement.signed_at).toLocaleString()}`}
          </p>
          <p className="mt-1 font-normal text-emerald-900/80">
            Status: {agreementStatusLabel(initialAgreement.status)}. Next step:
            issue the deposit invoice if you haven&apos;t already.
          </p>
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
              updateField("status", event.target.value as AgreementStatus)
            }
            value={values.status}
          >
            {AGREEMENT_STATUSES.map((status) => (
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
          Signer name
          <input
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateField("signerName", event.target.value)}
            placeholder="Client signatory"
            value={values.signerName}
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
              Tip: put consult notes in Internal notes, then draft with AI.
              Scope stays high-level; line items hold the billable detail.
              Terms stay manual.
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
          className="min-h-44 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) =>
            updateField("scopeSummary", event.target.value)
          }
          placeholder={
            "What we will do:\n1. ...\n\nExpected outcomes:\n- ...\n\nOut of scope:\n- ..."
          }
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
            const lineTotal = computeLineTotal(
              Number(item.quantity) || 0,
              Number(item.unitPrice) || 0,
            );
            return (
              <div
                className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_5rem_7rem_6rem_auto] [&>:first-child]:col-span-2 sm:[&>:first-child]:col-span-1"
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
          {depositAmount !== null ? (
            <p>
              <span className="text-muted-foreground">
                Deposit ({values.depositPercent}%):
              </span>{" "}
              <span className="font-semibold">{formatMoney(depositAmount)}</span>
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
