"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { deleteOrganization } from "@/app/admin/actions";
import { OrganizationForm } from "@/components/admin/organization-form";
import { Button } from "@/components/ui/button";
import type { CrmTableRow } from "@/lib/crm";
import {
  leadSourceLabel,
  leadStageLabel,
  type LeadRow,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  prospect: "bg-sky-50 text-sky-800 border-sky-200",
  do_not_use: "bg-red-50 text-red-800 border-red-200",
};

const stageStyles: Record<string, string> = {
  new_inquiry: "bg-sky-50 text-sky-800 border-sky-200",
  review_booked: "bg-indigo-50 text-indigo-800 border-indigo-200",
  review_completed: "bg-violet-50 text-violet-800 border-violet-200",
  proposal_sent: "bg-amber-50 text-amber-900 border-amber-200",
  won: "bg-emerald-50 text-emerald-800 border-emerald-200",
  lost: "bg-red-50 text-red-800 border-red-200",
};

type OrganizationDetailProps = {
  organization: CrmTableRow;
  leads: LeadRow[];
};

export function OrganizationDetail({
  organization,
  leads,
}: OrganizationDetailProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${organization.name}? This removes the organization and its linked primary contact.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const result = await deleteOrganization(organization.id);
    setDeleting(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete organization.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            href="/admin"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to CRM
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {organization.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {organization.relationshipTypes.map((type) => (
              <span
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold capitalize text-muted-foreground"
                key={type}
              >
                {type}
              </span>
            ))}
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                statusStyles[organization.status] ?? statusStyles.inactive,
              )}
            >
              {organization.status.replaceAll("_", " ")}
            </span>
            {organization.category ? (
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                {organization.category}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setError(null);
              setFormOpen(true);
            }}
            type="button"
            variant="outline"
          >
            <Pencil aria-hidden className="size-4" />
            Edit
          </Button>
          <Button
            disabled={deleting}
            onClick={handleDelete}
            type="button"
            variant="outline"
          >
            <Trash2 aria-hidden className="size-4" />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Company</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-1 font-medium">
                {organization.organizationEmail ? (
                  <a
                    className="inline-flex items-center gap-2 text-accent hover:underline"
                    href={`mailto:${organization.organizationEmail}`}
                  >
                    <Mail aria-hidden className="size-4" />
                    {organization.organizationEmail}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="mt-1 font-medium">
                {organization.organizationPhone ? (
                  <a
                    className="inline-flex items-center gap-2 text-accent hover:underline"
                    href={`tel:+1${organization.organizationPhone.replace(/\D/g, "")}`}
                  >
                    <Phone aria-hidden className="size-4" />
                    {organization.organizationPhone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Website</dt>
              <dd className="mt-1 font-medium">
                {organization.website ? (
                  <a
                    className="inline-flex items-center gap-2 text-accent hover:underline"
                    href={organization.website}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {organization.website}
                    <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="mt-1 inline-flex items-center gap-2 font-medium">
                {organization.location ? (
                  <>
                    <MapPin aria-hidden className="size-4 text-accent" />
                    {organization.location}
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
          {organization.notes ? (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Notes
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {organization.notes}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Primary contact</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="mt-1 font-medium">
                {organization.primaryContact || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Title</dt>
              <dd className="mt-1 font-medium">
                {organization.contactTitle || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-1 font-medium">
                {organization.email ? (
                  <a
                    className="text-accent hover:underline"
                    href={`mailto:${organization.email}`}
                  >
                    {organization.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="mt-1 font-medium">{organization.phone || "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Process Review history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pipeline leads linked to this organization.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/pipeline">Open Pipeline</Link>
          </Button>
        </div>

        {leads.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-semibold">No linked Process Review leads</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Marking a Pipeline lead Won will create or link a CRM customer
              here.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-semibold">Lead</th>
                  <th className="px-2 py-2 font-semibold">Contact</th>
                  <th className="px-2 py-2 font-semibold">Source</th>
                  <th className="px-2 py-2 font-semibold">Stage</th>
                  <th className="px-2 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr className="border-t border-border align-top" key={lead.id}>
                    <td className="px-2 py-3">
                      <div className="font-medium">{lead.title}</div>
                      {lead.message ? (
                        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                          {lead.message}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      <div>{lead.contact_name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {leadSourceLabel(lead.source)}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          stageStyles[lead.stage] ?? stageStyles.new_inquiry,
                        )}
                      >
                        {leadStageLabel(lead.stage)}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <OrganizationForm
        initialRow={organization}
        key={`edit-${organization.id}-${formOpen ? "open" : "closed"}`}
        mode="edit"
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
        open={formOpen}
      />
    </div>
  );
}
