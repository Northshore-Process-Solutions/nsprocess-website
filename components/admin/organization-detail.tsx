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

import { deleteOrganization } from "@/app/crm/actions";
import { ActivityPanel } from "@/components/admin/activity-panel";
import { OrganizationForm } from "@/components/admin/organization-form";
import { PurchasesPanel } from "@/components/admin/purchases-panel";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import {
  relationshipTypeLabel,
  type CrmTableRow,
} from "@/lib/crm";
import {
  leadSourceLabel,
  leadStageLabel,
  type LeadRow,
} from "@/lib/leads";
import {
  projectStatusLabel,
  type ProjectRow,
} from "@/lib/projects";
import type { PurchaseWithRelations } from "@/lib/purchases";
import {
  formatProposalMoney,
  proposalStatusLabel,
  type ProposalWithItems,
} from "@/lib/proposals";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  prospect: "bg-sky-50 text-sky-800 border-sky-200",
  do_not_use: "bg-red-50 text-red-800 border-red-200",
};

const stageStyles: Record<string, string> = {
  new_inquiry: "bg-sky-50 text-sky-800 border-sky-200",
  follow_up: "bg-cyan-50 text-cyan-800 border-cyan-200",
  review_booked: "bg-indigo-50 text-indigo-800 border-indigo-200",
  review_completed: "bg-violet-50 text-violet-800 border-violet-200",
  proposal_sent: "bg-amber-50 text-amber-900 border-amber-200",
  deposit_received: "bg-teal-50 text-teal-800 border-teal-200",
  won: "bg-emerald-50 text-emerald-800 border-emerald-200",
  lost: "bg-red-50 text-red-800 border-red-200",
};

const projectStatusStyles: Record<string, string> = {
  planning: "bg-sky-50 text-sky-800 border-sky-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-900 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

const proposalStatusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-amber-50 text-amber-900 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  declined: "bg-red-50 text-red-800 border-red-200",
  expired: "bg-stone-100 text-stone-700 border-stone-200",
};

type OrganizationDetailProps = {
  organization: CrmTableRow;
  leads: LeadRow[];
  projects: ProjectRow[];
  activities: ActivityRow[];
  purchases: PurchaseWithRelations[];
  proposals: ProposalWithItems[];
};

export function OrganizationDetail({
  organization,
  leads,
  projects,
  activities,
  purchases,
  proposals,
}: OrganizationDetailProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${organization.name}? This removes the business and its linked primary contact.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const result = await deleteOrganization(organization.id);
    setDeleting(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete business.");
      return;
    }

    router.push("/crm/businesses");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            href="/crm/businesses"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to Businesses
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            {organization.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {organization.relationshipTypes.map((type) => (
              <span
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground"
                key={type}
              >
                {relationshipTypeLabel(type)}
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
          <h2 className="text-lg font-semibold">Business</h2>
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

      <ActivityPanel
        activities={activities}
        organizationId={organization.id}
      />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Billing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Proposals linked to this business. Open Billing for agreements,
              invoices, and statements.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link
                href={`/crm/statements?organizationId=${organization.id}`}
              >
                Statement
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/crm/billing">Open Billing</Link>
            </Button>
          </div>
        </div>

        {proposals.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-semibold">No proposals yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create one from Pipeline after a consult.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-semibold">Proposal</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Total</th>
                  <th className="px-2 py-2 font-semibold">Issued</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => (
                  <tr
                    className="border-t border-border align-top"
                    key={proposal.id}
                  >
                    <td className="px-2 py-3">
                      <Link
                        className="font-medium text-accent hover:underline"
                        href={`/crm/proposals/${proposal.id}`}
                      >
                        {proposal.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {proposal.proposal_number}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          proposalStatusStyles[proposal.status] ??
                            proposalStatusStyles.draft,
                        )}
                      >
                        {proposalStatusLabel(proposal.status)}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {formatProposalMoney(proposal.total_amount)}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {new Date(
                        `${proposal.issued_at}T12:00:00`,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Purchases</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Spend linked to this business or its projects.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/crm/purchases">Open Purchases</Link>
          </Button>
        </div>
        <PurchasesPanel
          businesses={[{ id: organization.id, name: organization.name }]}
          defaults={{ organizationId: organization.id }}
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            organization_id: project.organization_id,
          }))}
          rows={purchases}
          showLinks
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Delivery work for this business after deposit.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/crm/projects">Open Projects</Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-semibold">No projects yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Moving a Pipeline lead to deposit received creates a project
              here.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-semibold">Project</th>
                  <th className="px-2 py-2 font-semibold">Started</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    className="border-t border-border align-top"
                    key={project.id}
                  >
                    <td className="px-2 py-3">
                      <Link
                        className="font-medium text-accent hover:underline"
                        href={`/crm/projects/${project.id}`}
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {project.started_at
                        ? new Date(
                            `${project.started_at}T12:00:00`,
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          projectStatusStyles[project.status] ??
                            projectStatusStyles.active,
                        )}
                      >
                        {projectStatusLabel(project.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Process Review history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pipeline leads linked to this business.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/crm/pipeline">Open Pipeline</Link>
          </Button>
        </div>

        {leads.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-semibold">No linked Process Review leads</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Marking a Pipeline lead deposit received creates a CRM business
              and project here.
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
