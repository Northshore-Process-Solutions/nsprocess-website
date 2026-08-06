import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoShell } from "@/components/demo/demo-shell";
import {
  DemoCard,
  DemoPageHeader,
  DemoRow,
  DemoStat,
} from "@/components/demo/demo-ui";
import { formatMoney } from "@/lib/billing";
import {
  demoCustomers,
  findAgreement,
  findInvoice,
  findProposal,
  loadDemoSeed,
} from "@/lib/demo/data";
import type { DemoDoc, DemoSeed } from "@/lib/demo/types";

type DocKind = "proposals" | "agreements" | "invoices";

const labels: Record<DocKind, string> = {
  proposals: "Proposal",
  agreements: "Agreement",
  invoices: "Invoice",
};

function findDoc(kind: DocKind, seed: DemoSeed, id: string): DemoDoc | null {
  if (kind === "proposals") return findProposal(seed, id);
  if (kind === "agreements") return findAgreement(seed, id);
  return findInvoice(seed, id);
}

export async function DemoDocDetailPage({
  kind,
  id,
}: {
  kind: DocKind;
  id: string;
}) {
  const seed = await loadDemoSeed();
  const doc = findDoc(kind, seed, id);
  if (!doc) notFound();

  const customer = demoCustomers(seed).find(
    (row) => row.name === doc.businessName,
  );

  return (
    <DemoShell businessName={seed.business.name}>
      <DemoPageHeader
        backHref="/demo/billing"
        backLabel="Billing"
        description={doc.title}
        title={`${labels[kind]} ${doc.number}`}
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <DemoStat label="Status" value={doc.status} />
        <DemoStat label="Total" value={formatMoney(doc.total)} />
        <DemoStat label="Issued" value={doc.issuedAt} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DemoCard title="Document">
          <dl className="space-y-2">
            <DemoRow label="Customer" value={doc.businessName} />
            <DemoRow label="Title" value={doc.title} />
            <DemoRow label="Number" value={doc.number} />
            <DemoRow label="Status" value={doc.status} />
            <DemoRow label="Amount" value={formatMoney(doc.total)} />
          </dl>
        </DemoCard>

        <DemoCard title="Account">
          {customer ? (
            <p className="text-sm">
              <Link
                className="font-medium text-slate-900 underline"
                href={`/demo/businesses/${customer.id}`}
              >
                Open {customer.name}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-slate-500">{doc.businessName}</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Demo documents are read-only snapshots — same sections as live
            billing.
          </p>
        </DemoCard>
      </div>
    </DemoShell>
  );
}
