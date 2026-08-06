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

function fallbackSeed(intake: DemoIntake): DemoSeed {
  const businessName = intake.businessName.trim() || "Demo Business";
  const contactName = intake.contactName.trim() || "Jordan Smith";
  const location = intake.location.trim() || "North Shore, MA";
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

  return {
    business: {
      id: "biz-1",
      name: businessName,
      category: intake.industry || "Services",
      location,
      email: "ops@example.com",
      phone: "(978) 555-0100",
      contactName,
      notes: intake.description || "Demo account seeded for walkthrough.",
      openBalance: 2500,
    },
    leads: [
      {
        id: "lead-1",
        businessName,
        contactName,
        email: "ops@example.com",
        phone: "(978) 555-0100",
        stage: "follow_up",
        source: "website_form",
        nextFollowUpAt: isoDay(0),
        message: intake.description || "Looking to clean up intake and follow-up.",
      },
      {
        id: "lead-2",
        businessName: `${businessName} Facilities`,
        contactName: "Alex Rivera",
        email: "alex@example.com",
        phone: "(978) 555-0101",
        stage: "review_completed",
        source: "referral",
        nextFollowUpAt: isoDay(1),
        message: "Ready for a proposal after consult.",
      },
      {
        id: "lead-3",
        businessName: "Neighboring Service Co",
        contactName: "Sam Lee",
        email: "sam@example.com",
        phone: "(978) 555-0102",
        stage: "new_inquiry",
        source: "website_form",
        nextFollowUpAt: isoDay(0),
        message: "Website inquiry about scheduling automation.",
      },
    ],
    proposals: [
      {
        id: "prop-1",
        number: "PROP-DEMO-0001",
        title: `${businessName} — Process Improvement Proposal`,
        status: "sent",
        total: 6500,
        businessName,
        issuedAt: isoDay(-3),
      },
      {
        id: "prop-2",
        number: "PROP-DEMO-0002",
        title: `${businessName} Facilities — Intake Cleanup`,
        status: "draft",
        total: 4200,
        businessName: `${businessName} Facilities`,
        issuedAt: isoDay(-1),
      },
    ],
    agreements: [
      {
        id: "agr-1",
        number: "AGR-DEMO-0001",
        title: `${businessName} — Engagement Agreement`,
        status: "signed",
        total: 6500,
        businessName,
        issuedAt: isoDay(-2),
      },
    ],
    invoices: [
      {
        id: "inv-1",
        number: "INV-DEMO-0001",
        title: "Deposit invoice",
        status: "sent",
        total: 2500,
        businessName,
        issuedAt: isoDay(-1),
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: `${businessName} — Process Improvement`,
        status: "active",
        nextAction: "Confirm kickoff agenda",
        businessName,
      },
    ],
    events: [
      {
        id: "evt-1",
        title: `Kickoff — ${businessName}`,
        startsAt: isoStamp(48),
        eventType: "onsite",
        businessName,
      },
    ],
    activities: [
      {
        id: "act-1",
        summary: "Website inquiry received",
        occurredAt: isoStamp(-72),
        kind: "note",
      },
      {
        id: "act-2",
        summary: "Process review completed",
        occurredAt: isoStamp(-48),
        kind: "note",
      },
      {
        id: "act-3",
        summary: "Proposal sent to client",
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
      system: `You generate realistic but fictional CRM demo seed data for North Shore Process Solutions, a Massachusetts North Shore operations consultancy.

Rules:
- Keep names and details grounded in the intake.
- Use UUID-like ids as short strings (e.g. lead-1, biz-1).
- Dates must be ISO date (YYYY-MM-DD) or full ISO timestamps.
- Include a clear sales-to-delivery story for the primary business.
- Do not invent NSPS internal secrets. Keep dollar amounts modest (1k–12k).
- nextFollowUpAt can be null or YYYY-MM-DD.
- At least one lead should be due for follow-up today or earlier.`,
      prompt: `Build a demo seed for this business intake:
${JSON.stringify(intake, null, 2)}

Today's date: ${new Date().toISOString().slice(0, 10)}
Location bias: Massachusetts North Shore unless intake says otherwise.`,
    });

    return object;
  } catch {
    return fallbackSeed(intake);
  }
}
