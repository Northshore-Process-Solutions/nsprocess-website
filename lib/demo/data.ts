import { redirect } from "next/navigation";

import { requireReadyDemoSession } from "@/lib/demo/session";
import type { DemoSeed, DemoSeedInput } from "@/lib/demo/types";

/** Normalize older demo sessions that predate purchases/tools fields. */
export function normalizeDemoSeed(seed: DemoSeedInput): DemoSeed {
  return {
    ...seed,
    purchases: seed.purchases ?? [],
    tools: seed.tools ?? [],
    projects: seed.projects.map((project) => ({
      ...project,
      scope: project.scope ?? project.nextAction,
    })),
  };
}

export async function loadDemoSeed(): Promise<DemoSeed> {
  const { session, error } = await requireReadyDemoSession();
  if (!session?.seed) {
    redirect(error?.includes("expired") ? "/demo?expired=1" : "/demo");
  }
  return normalizeDemoSeed(session.seed);
}

export function findLead(seed: DemoSeed, id: string) {
  return seed.leads.find((lead) => lead.id === id) ?? null;
}

export function findProject(seed: DemoSeed, id: string) {
  return seed.projects.find((project) => project.id === id) ?? null;
}

export function findProposal(seed: DemoSeed, id: string) {
  return seed.proposals.find((doc) => doc.id === id) ?? null;
}

export function findAgreement(seed: DemoSeed, id: string) {
  return seed.agreements.find((doc) => doc.id === id) ?? null;
}

export function findInvoice(seed: DemoSeed, id: string) {
  return seed.invoices.find((doc) => doc.id === id) ?? null;
}

/** Customer accounts derived from pipeline leads (company-operator POV). */
export function demoCustomers(seed: DemoSeed) {
  const byName = new Map<
    string,
    {
      id: string;
      name: string;
      contactName: string;
      email: string;
      phone: string;
      stage: string;
      message: string;
    }
  >();

  for (const lead of seed.leads) {
    if (!byName.has(lead.businessName)) {
      byName.set(lead.businessName, {
        id: lead.id,
        name: lead.businessName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        stage: lead.stage,
        message: lead.message,
      });
    }
  }

  return Array.from(byName.values());
}
