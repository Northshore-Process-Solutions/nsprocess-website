import { generateObject } from "ai";
import { z } from "zod";

import { getDraftModel } from "@/lib/ai/openai";
import type { DemoIntake, DemoSeed } from "@/lib/demo/types";

const seedSchema = z.object({
  business: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    location: z.string(),
    email: z.string(),
    phone: z.string(),
    contactName: z.string(),
    notes: z.string(),
    openBalance: z.number(),
  }),
  leads: z
    .array(
      z.object({
        id: z.string(),
        businessName: z.string(),
        contactName: z.string(),
        email: z.string(),
        phone: z.string(),
        stage: z.enum([
          "new_inquiry",
          "follow_up",
          "review_booked",
          "review_completed",
          "proposal_sent",
          "deposit_received",
          "won",
          "lost",
        ]),
        source: z.string(),
        nextFollowUpAt: z.string().nullable(),
        message: z.string(),
      }),
    )
    .min(3)
    .max(5),
  proposals: z
    .array(
      z.object({
        id: z.string(),
        number: z.string(),
        title: z.string(),
        status: z.string(),
        total: z.number(),
        businessName: z.string(),
        issuedAt: z.string(),
      }),
    )
    .min(1)
    .max(3),
  agreements: z
    .array(
      z.object({
        id: z.string(),
        number: z.string(),
        title: z.string(),
        status: z.string(),
        total: z.number(),
        businessName: z.string(),
        issuedAt: z.string(),
      }),
    )
    .min(1)
    .max(2),
  invoices: z
    .array(
      z.object({
        id: z.string(),
        number: z.string(),
        title: z.string(),
        status: z.string(),
        total: z.number(),
        businessName: z.string(),
        issuedAt: z.string(),
      }),
    )
    .min(1)
    .max(3),
  projects: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(["planning", "active", "on_hold", "completed"]),
        nextAction: z.string(),
        businessName: z.string(),
      }),
    )
    .min(1)
    .max(2),
  events: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        startsAt: z.string(),
        eventType: z.string(),
        businessName: z.string(),
      }),
    )
    .min(1)
    .max(3),
  activities: z
    .array(
      z.object({
        id: z.string(),
        summary: z.string(),
        occurredAt: z.string(),
        kind: z.string(),
      }),
    )
    .min(3)
    .max(8),
});

function industryLabel(intake: DemoIntake) {
  return intake.industry.trim() || "local service";
}

function fallbackSeed(intake: DemoIntake): DemoSeed {
  const companyName = intake.businessName.trim() || "Demo Business";
  const ownerName = intake.contactName.trim() || "Jordan Smith";
  const location = intake.location.trim() || "North Shore, MA";
  const industry = industryLabel(intake);
  const today = new Date();
  const isoDay = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const isoStamp = (offsetHours: number) => {
    const d = new Date(today);
    d.setHours(d.getHours() + offsetHours);
    return d.toISOString();
  };

  // Generic but job-shaped fallback; AI path should be industry-specific.
  const customerA = "Rivera Residence";
  const customerB = "Harbor Street Cafe";
  const customerC = "Oakdale Property Group";

  return {
    business: {
      id: "company-1",
      name: companyName,
      category: industry,
      location,
      email: "office@example.com",
      phone: "(978) 555-0100",
      contactName: ownerName,
      notes:
        intake.description ||
        `${companyName} demo workspace for running ${industry} jobs.`,
      openBalance: 3200,
    },
    leads: [
      {
        id: "lead-1",
        businessName: customerA,
        contactName: "Alex Rivera",
        email: "alex.rivera@example.com",
        phone: "(978) 555-0141",
        stage: "follow_up",
        source: "website_form",
        nextFollowUpAt: isoDay(0),
        message: `New ${industry} quote request — wants pricing and schedule options.`,
      },
      {
        id: "lead-2",
        businessName: customerB,
        contactName: "Sam Lee",
        email: "sam@harborcafe.example",
        phone: "(978) 555-0142",
        stage: "review_completed",
        source: "referral",
        nextFollowUpAt: isoDay(1),
        message: `Site walk done. Ready for a written proposal on the ${industry} work.`,
      },
      {
        id: "lead-3",
        businessName: customerC,
        contactName: "Taylor Brooks",
        email: "tbrooks@oakdale.example",
        phone: "(978) 555-0143",
        stage: "new_inquiry",
        source: "website_form",
        nextFollowUpAt: isoDay(0),
        message: `Multi-unit ${industry} inquiry. Asking about timeline and deposit.`,
      },
    ],
    proposals: [
      {
        id: "prop-1",
        number: "PROP-DEMO-0001",
        title: `${customerB} — ${industry} proposal`,
        status: "sent",
        total: 8400,
        businessName: customerB,
        issuedAt: isoDay(-3),
      },
      {
        id: "prop-2",
        number: "PROP-DEMO-0002",
        title: `${customerA} — ${industry} quote`,
        status: "draft",
        total: 4100,
        businessName: customerA,
        issuedAt: isoDay(-1),
      },
    ],
    agreements: [
      {
        id: "agr-1",
        number: "AGR-DEMO-0001",
        title: `${customerB} — job agreement`,
        status: "signed",
        total: 8400,
        businessName: customerB,
        issuedAt: isoDay(-2),
      },
    ],
    invoices: [
      {
        id: "inv-1",
        number: "INV-DEMO-0001",
        title: `${customerB} — deposit`,
        status: "sent",
        total: 3200,
        businessName: customerB,
        issuedAt: isoDay(-1),
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: `${customerB} — ${industry} install`,
        status: "active",
        nextAction: "Confirm equipment delivery and crew day",
        businessName: customerB,
      },
    ],
    events: [
      {
        id: "evt-1",
        title: `Install — ${customerB}`,
        startsAt: isoStamp(48),
        eventType: "onsite",
        businessName: customerB,
      },
      {
        id: "evt-2",
        title: `Estimate visit — ${customerA}`,
        startsAt: isoStamp(24),
        eventType: "onsite",
        businessName: customerA,
      },
    ],
    activities: [
      {
        id: "act-1",
        summary: `${customerC} submitted a web inquiry`,
        occurredAt: isoStamp(-72),
        kind: "note",
      },
      {
        id: "act-2",
        summary: `Completed site review at ${customerB}`,
        occurredAt: isoStamp(-48),
        kind: "note",
      },
      {
        id: "act-3",
        summary: `Sent proposal to ${customerB}`,
        occurredAt: isoStamp(-24),
        kind: "email",
      },
    ],
  };
}

export async function generateDemoSeed(intake: DemoIntake): Promise<DemoSeed> {
  try {
    const { object } = await generateObject({
      model: getDraftModel(),
      schema: seedSchema,
      system: `You generate CRM demo seed data from the POINT OF VIEW of the visitor's company.

The visitor IS the business owner/operator. The CRM is THEIR operating system for running jobs — not a consultancy selling to them.

Critical framing:
- business = the visitor's company (the CRM owner). Example: "North Shore Comfort HVAC".
- leads = THEIR customers/prospects (homeowners, restaurants, property managers, etc.). Never make the visitor's company a lead.
- leads.businessName = customer/account label (e.g. "Rivera Residence", "Harbor Street Cafe").
- leads.contactName = the customer's contact person.
- leads.message = what the customer wants (install, repair, quote, service call) in that industry's language.
- proposals / agreements / invoices = paperwork the visitor's company sends TO those customers for jobs.
- projects = active jobs/work orders for those customers.
- events = estimates, installs, service calls, follow-ups on the calendar.
- activities = internal notes/emails about those customer jobs.

Industry fidelity:
- If industry is HVAC: heat pumps, furnace swaps, AC installs, maintenance plans, load calculations, etc.
- If dental: new patient inquiries, chair time, treatment plans — still mapped onto leads/proposals/projects.
- Always mirror the intake industry and description. Do not invent "process improvement consulting" unless the intake company IS a consultancy.

Rules:
- Use short ids (lead-1, company-1, prop-1).
- Dates: YYYY-MM-DD or full ISO timestamps.
- Dollar amounts realistic for that trade (often $500–$25,000).
- At least one lead follow-up due today or earlier.
- Include a clear path: inquiry → proposal → agreement/deposit invoice → active job/project.
- Keep all names fictional.`,
      prompt: `Build a company-operator CRM demo seed for this intake:
${JSON.stringify(intake, null, 2)}

Today's date: ${new Date().toISOString().slice(0, 10)}
Default geography: Massachusetts North Shore unless intake says otherwise.

Remember: the visitor runs ${intake.businessName || "this company"}. Populate THEIR pipeline with THEIR customers and jobs.`,
    });

    return object;
  } catch {
    return fallbackSeed(intake);
  }
}
