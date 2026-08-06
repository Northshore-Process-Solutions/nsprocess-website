import { generateObject } from "ai";
import { z } from "zod";

import { getDemoSeedModel } from "@/lib/ai/openai";
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
        // OpenAI strict JSON schema requires every property to be listed in
        // `required` — use nullable, not optional.
        scope: z.string(),
        startDate: z.string().nullable(),
        targetDate: z.string().nullable(),
      }),
    )
    .min(1)
    .max(3),
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
  purchases: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        amount: z.number(),
        purchasedAt: z.string(),
        vendor: z.string(),
        businessName: z.string(),
        purchaseType: z.string(),
      }),
    )
    .min(2)
    .max(5),
  tools: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        status: z.enum(["active", "evaluating", "retired"]),
        notes: z.string(),
        monthlyCost: z.number(),
      }),
    )
    .min(3)
    .max(6),
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

export async function generateDemoSeed(intake: DemoIntake): Promise<DemoSeed> {
  try {
    const { object } = await generateObject({
      model: getDemoSeedModel(),
      schema: seedSchema,
      system: `You generate CRM demo seed data from the POINT OF VIEW of the visitor's company.

The visitor IS the business owner/operator. The CRM is THEIR operating system for running jobs — not a consultancy selling to them.

Critical framing:
- business = the visitor's company (the CRM owner). Example: "North Shore Comfort HVAC".
- leads = THEIR customers/prospects. Never make the visitor's company a lead.
- leads.businessName = a realistic customer/account name only (company, residence, town department, school, etc.). It must look like a real CRM account label.
  Good: "Rivera Residence", "Harbor Street Cafe", "Town of Amesbury DPW", "Oakdale Property Group".
  Bad: "HVAC inquiry A", "HVAC job B", "HVAC lead C", "Computer Repair lead 1", anything with inquiry/job/lead/quote/customer A-B-C as the name.
- leads.contactName = the customer's contact person.
- leads.message = the raw website contact-form / inquiry text written IN THE CUSTOMER'S VOICE (first person). It must sound like something a person typed into a "Contact us" or "Request a quote" box — short, natural, a bit messy is fine. NEVER a third-person CRM summary.
  Bad: "New Computer Repair quote request — wants pricing and schedule options."
  Good: "My computer is acting very slow and I think it has viruses. Wanted to see about cleanup and availability."
  Good (public sector): "We need quotes to refresh 12 staff laptops before FY end. Can you come on-site to Amesbury Town Hall next week?"
- leads.source is often website_form for these inbound messages.
- proposals / agreements / invoices = paperwork the visitor's company sends TO those customers for jobs.
- projects = active jobs/work orders for those customers (include scope + optional dates).
- events = estimates, installs, service calls, follow-ups on the calendar.
- purchases = materials/supplies/ops spend tied to jobs or the shop.
- tools = the visitor company's software/stack (scheduling, accounting, email, field apps).
- activities = internal notes/emails about those customer jobs.

Intake fidelity (non-negotiable):
- Treat intake.description as the source of truth for who they sell to and how work is won.
- If they mention state contracts, government, municipalities, schools, or public-sector work: MOST leads/customers must be those entities (e.g. "MA DOT District 4", "Town of Amesbury DPW", "Salem Public Schools") — not residential homeowners or random cafes.
- If they mention residential / homeowners: prefer residences and property managers.
- If they mention commercial / restaurants / property groups: prefer those account types.
- Mirror niche details from the description in messages, proposal titles, project scopes, and activities (contract vehicles, bid cycles, compliance, seasonality, etc.).
- Always mirror the intake industry. Do not invent "process improvement consulting" unless the intake company IS a consultancy.

Industry examples (only when they fit intake):
- HVAC: heat pumps, furnace swaps, AC installs, maintenance plans, load calculations.
- Dental: new patient inquiries, chair time, treatment plans — mapped onto leads/proposals/projects.

Rules:
- Use short ids (lead-1, company-1, prop-1).
- Dates: YYYY-MM-DD or full ISO timestamps.
- Dollar amounts realistic for that trade and customer type (public-sector jobs are often larger).
- At least one lead follow-up due today or earlier.
- Include a clear path: inquiry → proposal → agreement/deposit invoice → active job/project.
- Keep all names fictional but plausible for the stated customer type.
- leads.businessName must never include workflow words like inquiry, job, lead, quote, prospect, or lettered placeholders (A/B/C).
- At least 3 of 5 leads (or all leads if fewer) must clearly match the primary customer type from intake.description.
- Every leads.message must be first-person customer voice (website form style), not an internal summary or status note.`,
      prompt: `Build a company-operator CRM demo seed for this intake:
${JSON.stringify(intake, null, 2)}

Today's date: ${new Date().toISOString().slice(0, 10)}
Default geography: use intake.location when present; otherwise Massachusetts North Shore.

Primary customer type to invent for (derive from description/industry):
"${intake.description}"

Remember: the visitor runs ${intake.businessName || "this company"}. Populate THEIR pipeline with customers that match how THEY actually win work — not a generic small-business sample.

leads.message examples of the tone required (adapt to this industry/customer type; do not copy verbatim):
- "My laptop keeps freezing when I open Excel. Can someone look at it this week?"
- "Hi — our office printers are jamming constantly. Looking for a service visit and maybe a maintenance plan."
- "We're a town department needing 8 desktops quoted for a grant purchase. Who should I email the specs to?"`,
    });

    return {
      ...object,
      purchases: object.purchases ?? [],
      tools: object.tools ?? [],
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Demo seed generation failed.";
    console.error("[demo-seed] generateObject failed:", message, error);
    throw new Error(
      `Could not build demo data with AI (${message}). Check OPENAI_API_KEY and try again.`,
    );
  }
}
