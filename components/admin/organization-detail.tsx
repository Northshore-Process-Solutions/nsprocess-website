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
import { useMemo, useState } from "react";

import { deleteOrganization } from "@/app/crm/actions";
import { ActivityPanel } from "@/components/admin/activity-panel";
import { OrganizationForm } from "@/components/admin/organization-form";
import { PurchasesPanel } from "@/components/admin/purchases-panel";
import { usePortal } from "@/components/portal/portal-provider";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/lib/activities";
import {
  agreementStatusLabel,
  type AgreementRow,
} from "@/lib/agreements";
import { formatMoney } from "@/lib/billing";
import {
  relationshipTypeLabel,
  type CrmTableRow,
} from "@/lib/crm";
import {
  invoiceBalance,
  invoiceStatusLabel,
  invoiceTypeLabel,
  type InvoiceRow,
} from "@/lib/invoices";
import {
  isCustomerStage,
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

const docStatusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-amber-50 text-amber-900 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  signed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  declined: "bg-red-50 text-red-800 border-red-200",
  expired: "bg-stone-100 text-stone-700 border-stone-200",
  void: "bg-stone-100 text-stone-700 border-stone-200",
};

type OrganizationDetailProps = {
  organization: CrmTableRow;
  leads: LeadRow[];
  projects: ProjectRow[];
  activities: ActivityRow[];
  purchases: PurchaseWithRelations[];
  proposals: ProposalWithItems[];
  agreements: AgreementRow[];
  invoices: InvoiceRow[];
  readOnly?: boolean;
};

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-xs font-medium",
        tone ?? "border-slate-200 bg-white text-slate-600",
      )}
    >
      {label}
    </span>
  );
}

function HubCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 px-3 py-5 text-center">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export function OrganizationDetail({
  organization,
  leads,
  projects,
  activities,
  purchases,
  proposals,
  agreements,
  invoices,
  readOnly = false,
}: OrganizationDetailProps) {
  const router = useRouter();
  const { href } = usePortal();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openLeads = useMemo(
    () =>
      leads.filter(
        (lead) => !isCustomerStage(lead.stage) && lead.stage !== "lost",
      ),
    [leads],
  );

  const activeProjects = useMemo(
    () =>
      projects.filter((project) =>
        ["planning", "active", "on_hold"].includes(project.status),
      ),
    [projects],
  );

  const openInvoices = useMemo(
    () => invoices.filter((invoice) => ["draft", "sent"].includes(invoice.status)),
    [invoices],
  );

  const openBalance = useMemo(
    () => openInvoices.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0),
    [openInvoices],
  );

  const latestProposal = proposals[0] ?? null;
  const latestAgreement = agreements[0] ?? null;
  const latestInvoice = invoices[0] ?? null;
  const latestOpenInvoice = openInvoices[0] ?? null;

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

    router.push(href("/businesses"));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            href={href("/businesses")}
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to Businesses
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {organization.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {organization.relationshipTypes.map((type) => (
              <StatusPill key={type} label={relationshipTypeLabel(type)} />
            ))}
            {(() => {
              const statusLabel = organization.status.replaceAll("_", " ");
              const relationshipLabels = new Set(
                organization.relationshipTypes.map((type) =>
                  relationshipTypeLabel(type).toLowerCase(),
                ),
              );
              // Avoid "Prospect" + "prospect" when relationship is lead and status is prospect
              if (relationshipLabels.has(statusLabel.toLowerCase())) {
                return null;
              }
              return (
                <StatusPill
                  label={statusLabel}
                  tone={
                    statusStyles[organization.status] ?? statusStyles.inactive
                  }
                />
              );
            })()}
            {organization.category ? (
              <StatusPill label={organization.category} />
            ) : null}
          </div>
        </div>
        {!readOnly ? (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setError(null);
                setFormOpen(true);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </Button>
            <Button
              disabled={deleting}
              onClick={handleDelete}
              size="sm"
              type="button"
              variant="outline"
            >
              <Trash2 aria-hidden className="size-3.5" />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Open balance
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold text-slate-900",
              openBalance > 0 && "text-amber-800",
            )}
          >
            {formatMoney(openBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {openInvoices.length} open invoice
            {openInvoices.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pipeline
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {openLeads.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Open inquiries</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Delivery
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {activeProjects.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active projects</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Spend
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {purchases.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Linked purchases</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <HubCard title="Account" description="Business profile and primary contact">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Business email</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {organization.organizationEmail ? (
                  <a
                    className="inline-flex items-center gap-1.5 hover:underline"
                    href={`mailto:${organization.organizationEmail}`}
                  >
                    <Mail aria-hidden className="size-3.5 text-slate-400" />
                    {organization.organizationEmail}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Business phone</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {organization.organizationPhone ? (
                  <a
                    className="inline-flex items-center gap-1.5 hover:underline"
                    href={`tel:+1${organization.organizationPhone.replace(/\D/g, "")}`}
                  >
                    <Phone aria-hidden className="size-3.5 text-slate-400" />
                    {organization.organizationPhone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Website</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {organization.website ? (
                  <a
                    className="inline-flex items-center gap-1.5 hover:underline"
                    href={organization.website}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {organization.website.replace(/^https?:\/\//, "")}
                    <ExternalLink aria-hidden className="size-3 text-slate-400" />
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Location</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-slate-900">
                {organization.location ? (
                  <>
                    <MapPin aria-hidden className="size-3.5 text-slate-400" />
                    {organization.location}
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="sm:col-span-2 border-t border-slate-100 pt-3">
              <dt className="text-xs text-slate-500">Primary contact</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {organization.primaryContact || "—"}
                {organization.contactTitle
                  ? ` · ${organization.contactTitle}`
                  : ""}
              </dd>
              <dd className="mt-1 text-sm text-slate-600">
                {[organization.email, organization.phone]
                  .filter(Boolean)
                  .join(" · ") || "No contact details"}
              </dd>
            </div>
            {organization.notes ? (
              <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                <dt className="text-xs text-slate-500">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {organization.notes}
                </dd>
              </div>
            ) : null}
          </dl>
        </HubCard>

        <HubCard
          actions={
            <>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={href(`/statements?organizationId=${organization.id}`)}
                >
                  Statement
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={href("/billing")}>Billing</Link>
              </Button>
            </>
          }
          description="Money paperwork for this account"
          title="Billing"
        >
          <div className="space-y-2">
            <BillingSnapshotRow
              empty="No proposals yet"
              href={
                latestProposal ? href(`/proposals/${latestProposal.id}`) : null
              }
              label="Latest proposal"
              meta={
                latestProposal
                  ? `${proposalStatusLabel(latestProposal.status)} · ${formatProposalMoney(latestProposal.total_amount)}`
                  : null
              }
              title={latestProposal?.title ?? null}
            />
            <BillingSnapshotRow
              empty="No agreements yet"
              href={
                latestAgreement
                  ? href(`/agreements/${latestAgreement.id}`)
                  : null
              }
              label="Latest agreement"
              meta={
                latestAgreement
                  ? `${agreementStatusLabel(latestAgreement.status)} · ${formatMoney(latestAgreement.total_amount)}`
                  : null
              }
              title={latestAgreement?.title ?? null}
            />
            <BillingSnapshotRow
              empty="No invoices yet"
              href={
                (latestOpenInvoice ?? latestInvoice)
                  ? href(`/invoices/${(latestOpenInvoice ?? latestInvoice)!.id}`)
                  : null
              }
              label={latestOpenInvoice ? "Open invoice" : "Latest invoice"}
              meta={
                (latestOpenInvoice ?? latestInvoice)
                  ? `${invoiceTypeLabel((latestOpenInvoice ?? latestInvoice)!.invoice_type)} · ${invoiceStatusLabel((latestOpenInvoice ?? latestInvoice)!.status)} · ${formatMoney(invoiceBalance(latestOpenInvoice ?? latestInvoice!))} due`
                  : null
              }
              title={(latestOpenInvoice ?? latestInvoice)?.title ?? null}
            />
          </div>

          {proposals.length + agreements.length + invoices.length > 0 ? (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Document counts
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {proposals.length} proposal{proposals.length === 1 ? "" : "s"} ·{" "}
                {agreements.length} agreement
                {agreements.length === 1 ? "" : "s"} · {invoices.length}{" "}
                invoice{invoices.length === 1 ? "" : "s"}
              </p>
            </div>
          ) : null}
        </HubCard>

        <HubCard
          actions={
            <Button asChild size="sm" variant="outline">
              <Link href={href("/pipeline")}>Pipeline</Link>
            </Button>
          }
          description="Open inquiries still in motion"
          title="Pipeline"
        >
          {openLeads.length === 0 ? (
            <EmptyState
              detail="Convert work from Pipeline, or reopen a follow-up if needed."
              title="No open pipeline"
            />
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {openLeads.slice(0, 5).map((lead) => (
                <li className="px-3 py-2.5" key={lead.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {lead.contact_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {leadSourceLabel(lead.source)}
                        {lead.next_follow_up_at
                          ? ` · Follow up ${lead.next_follow_up_at}`
                          : ""}
                      </p>
                    </div>
                    <StatusPill
                      label={leadStageLabel(lead.stage)}
                      tone={stageStyles[lead.stage] ?? stageStyles.new_inquiry}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {leads.length > openLeads.length ? (
            <p className="mt-2 text-xs text-slate-500">
              +{leads.length - openLeads.length} closed lead
              {leads.length - openLeads.length === 1 ? "" : "s"} in history
            </p>
          ) : null}
        </HubCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HubCard
          actions={
            <Button asChild size="sm" variant="outline">
              <Link href={href("/projects")}>Projects</Link>
            </Button>
          }
          description="Delivery work after deposit"
          title="Projects"
        >
          {projects.length === 0 ? (
            <EmptyState
              detail="Deposit received in Pipeline creates a project here."
              title="No projects yet"
            />
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {projects.slice(0, 6).map((project) => (
                <li key={project.id}>
                  <Link
                    className="flex items-start justify-between gap-3 px-3 py-2.5 transition hover:bg-slate-50"
                    href={href(`/projects/${project.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {project.next_action
                          ? project.next_action
                          : project.started_at
                            ? `Started ${new Date(`${project.started_at}T12:00:00`).toLocaleDateString()}`
                            : "No next action"}
                      </p>
                    </div>
                    <StatusPill
                      label={projectStatusLabel(project.status)}
                      tone={
                        projectStatusStyles[project.status] ??
                        projectStatusStyles.active
                      }
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </HubCard>

        <HubCard
          actions={
            <Button asChild size="sm" variant="outline">
              <Link href={href("/purchases")}>Purchases</Link>
            </Button>
          }
          description="Spend linked to this account or its projects"
          title="Purchases"
        >
          <PurchasesPanel
            businesses={[{ id: organization.id, name: organization.name }]}
            defaults={{ organizationId: organization.id }}
            projects={projects.map((project) => ({
              id: project.id,
              name: project.name,
              organization_id: project.organization_id,
            }))}
            readOnly={readOnly}
            rows={purchases}
            showLinks
          />
        </HubCard>
      </div>

      <HubCard
        description="Communication and touchpoints for this account"
        title="Activity"
      >
        <ActivityPanel
          activities={activities}
          organizationId={organization.id}
          readOnly={readOnly}
        />
      </HubCard>

      {leads.length > 0 ? (
        <HubCard
          description="Full Process Review / pipeline history"
          title="Lead history"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Lead</th>
                  <th className="px-2 py-2 font-medium">Contact</th>
                  <th className="px-2 py-2 font-medium">Source</th>
                  <th className="px-2 py-2 font-medium">Stage</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr className="border-t border-slate-100 align-top" key={lead.id}>
                    <td className="px-2 py-2.5">
                      <div className="font-medium text-slate-900">
                        {lead.title}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <div>{lead.contact_name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      {leadSourceLabel(lead.source)}
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusPill
                        label={leadStageLabel(lead.stage)}
                        tone={stageStyles[lead.stage] ?? stageStyles.new_inquiry}
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HubCard>
      ) : null}

      {(proposals.length > 1 ||
        agreements.length > 1 ||
        invoices.length > 1) && (
        <HubCard
          description="All paperwork linked to this business"
          title="Billing history"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <DocList
              empty="No proposals"
              items={proposals.map((proposal) => ({
                id: proposal.id,
                href: href(`/proposals/${proposal.id}`),
                title: proposal.title,
                meta: `${proposal.proposal_number} · ${formatProposalMoney(proposal.total_amount)}`,
                status: proposalStatusLabel(proposal.status),
                tone:
                  docStatusStyles[proposal.status] ?? docStatusStyles.draft,
              }))}
              title="Proposals"
            />
            <DocList
              empty="No agreements"
              items={agreements.map((agreement) => ({
                id: agreement.id,
                href: href(`/agreements/${agreement.id}`),
                title: agreement.title,
                meta: `${agreement.agreement_number} · ${formatMoney(agreement.total_amount)}`,
                status: agreementStatusLabel(agreement.status),
                tone:
                  docStatusStyles[agreement.status] ?? docStatusStyles.draft,
              }))}
              title="Agreements"
            />
            <DocList
              empty="No invoices"
              items={invoices.map((invoice) => ({
                id: invoice.id,
                href: href(`/invoices/${invoice.id}`),
                title: invoice.title,
                meta: `${invoice.invoice_number} · ${formatMoney(invoiceBalance(invoice))} due`,
                status: invoiceStatusLabel(invoice.status),
                tone: docStatusStyles[invoice.status] ?? docStatusStyles.draft,
              }))}
              title="Invoices"
            />
          </div>
        </HubCard>
      )}

      {!readOnly ? (
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
      ) : null}
    </div>
  );
}

function BillingSnapshotRow({
  label,
  title,
  meta,
  href,
  empty,
}: {
  label: string;
  title: string | null;
  meta: string | null;
  href: string | null;
  empty: string;
}) {
  const body = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {title ? (
        <>
          <p className="mt-1 text-sm font-medium text-slate-900">{title}</p>
          {meta ? (
            <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-400">{empty}</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        className="block rounded-md border border-slate-200 px-3 py-2.5 transition hover:border-slate-400 hover:bg-slate-50"
        href={href}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="rounded-md border border-dashed border-slate-200 px-3 py-2.5">
      {body}
    </div>
  );
}

function DocList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{
    id: string;
    href: string;
    title: string;
    meta: string;
    status: string;
    tone: string;
  }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Link
                className="flex items-start justify-between gap-2 px-3 py-2 transition hover:bg-slate-50"
                href={item.href}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.meta}</p>
                </div>
                <StatusPill label={item.status} tone={item.tone} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
