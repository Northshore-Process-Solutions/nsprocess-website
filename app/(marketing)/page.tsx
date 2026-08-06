import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  HeartHandshake,
  Mail,
  MessageSquare,
  Repeat,
  Users,
} from "lucide-react";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { faqs, industries, problems, testimonials } from "@/lib/site-data";

const serviceHighlights = [
  {
    title: "Process reviews",
    description:
      "Find the bottlenecks, duplicate work, and unclear handoffs that quietly steal time.",
    icon: ClipboardList,
  },
  {
    title: "Workflow automation",
    description:
      "Let routine updates, reminders, forms, and follow-ups happen without manual chasing.",
    icon: Repeat,
  },
  {
    title: "Practical AI",
    description:
      "Use AI where it helps: drafting, summarizing, organizing, and answering common questions.",
    icon: Bot,
  },
  {
    title: "Better business systems",
    description:
      "Improve CRMs, scheduling, documents, dashboards, and the tools your team already uses.",
    icon: CalendarCheck,
  },
];

const busyworkCosts = [
  "Hours lost to admin work every week",
  "Revenue delayed by slow follow-up",
  "Employees frustrated by repeated data entry",
  "Customers waiting for updates",
  "Growth limited by owner bottlenecks",
];

const processSteps = [
  {
    title: "Understand",
    description: "We learn how your business operates today.",
  },
  {
    title: "Identify",
    description: "We uncover repetitive work that is stealing your time.",
  },
  {
    title: "Improve",
    description:
      "We implement practical AI, automation, and streamlined workflows.",
  },
  {
    title: "Grow",
    description:
      "You spend less time managing busywork and more time growing the business.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <div>
              <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Helping Small Businesses Get Their Time Back.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                Stop spending your evenings buried in emails, spreadsheets,
                paperwork, and repetitive tasks. We help North Shore businesses
                automate the busywork that&apos;s slowing them down using
                practical software, AI, and smarter workflows, so you can focus
                on serving customers and growing your business.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="accent">
                  <Link href="/contact">
                    Book Your Free Process Review
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-we-help">See How We Help</a>
                </Button>
              </div>
              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["5-10", "hours reclaimed each week"],
                  ["0", "pressure during the review"],
                  ["1", "clear next step"],
                ].map(([value, label]) => (
                  <div
                    className="rounded-2xl border border-border bg-card/80 p-5 shadow-soft"
                    key={label}
                  >
                    <dt className="text-3xl font-bold text-primary">{value}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative">
              <div className="absolute -left-8 -top-8 size-40 rounded-full bg-accent/10 blur-3xl" />
              <Card className="relative overflow-hidden p-4">
                <div className="rounded-[1.25rem] bg-muted p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Mail aria-hidden className="size-4 text-accent" />
                        Before
                      </div>
                      {[
                        "Paper forms waiting to be entered",
                        "Inbox full of follow-up reminders",
                        "Spreadsheet updated by hand",
                        "Owner answering after dinner",
                      ].map((item) => (
                        <div
                          className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground"
                          key={item}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 rounded-2xl bg-primary p-5 text-primary-foreground">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/70">
                        <CheckCircle2 aria-hidden className="size-4 text-accent" />
                        After
                      </div>
                      {[
                        "Digital intake routes clean information",
                        "Follow-ups happen automatically",
                        "Dashboard shows what needs attention",
                        "Evenings are yours again",
                      ].map((item) => (
                        <div
                          className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm"
                          key={item}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Card className="grid gap-8 overflow-hidden p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  Trusted Local Business Partner
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Built for small businesses, not enterprise boardrooms.
                </h2>
              </div>
              <div className="space-y-4 text-lg leading-8 text-muted-foreground">
                <p>
                  North Shore Process Solutions helps local business owners make
                  daily work simpler. We are not an IT company, MSP, reseller,
                  or big consulting firm. We are a practical advisor who
                  understands that technology only matters when it saves time.
                </p>
                <p>
                  Our work starts with your real operations: the forms, emails,
                  calls, spreadsheets, handoffs, reminders, and decisions that
                  keep the business moving.
                </p>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHeading
              eyebrow="The Hidden Cost of Busywork"
              title="Repetitive work costs more than time."
              description="It drains attention, slows customers down, frustrates employees, and keeps owners stuck in the business after hours."
              className="[&_*]:text-primary-foreground"
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {busyworkCosts.map((cost, index) => (
              <Reveal delay={index * 0.04} key={cost}>
                <div className="flex h-full gap-4 rounded-2xl border border-white/10 bg-white/10 p-5">
                  <Clock aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                  <p className="font-medium leading-7">{cost}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Common Problems We Solve"
              title="If this sounds familiar, you are not behind. Your systems just need help."
              description="Most business owners already know where the pain is. We help turn those daily frustrations into calmer, more reliable ways of working."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {problems.map((problem, index) => (
              <Reveal delay={index * 0.04} key={problem.quote}>
                <Card className="h-full transition duration-200 hover:-translate-y-1 hover:shadow-card">
                  <CardHeader>
                    <MessageSquare aria-hidden className="size-6 text-accent" />
                    <CardTitle className="text-lg">“{problem.quote}”</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-7">
                      {problem.answer}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Our Services"
              title="Practical improvements that make your business easier to run."
              description="We do not sell software. We improve how work gets done, using the right mix of process improvement, automation, AI, and modern business tools."
            />
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {serviceHighlights.map((service, index) => {
              const Icon = service.icon;

              return (
                <Reveal delay={index * 0.05} key={service.title}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-accent">
                        <Icon aria-hidden className="size-6" />
                      </div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription className="text-base leading-7">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-10">
            <Button asChild variant="outline">
              <Link href="/services">
                Explore All Services
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8" id="how-we-help">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="How We Help"
              title="A simple path from overwhelmed to organized."
              description="You do not need to know what to automate. You just need someone to help you find where time is being lost and fix it in the right order."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <Reveal delay={index * 0.05} key={step.title}>
                <Card className="h-full p-6">
                  <div className="mb-6 grid size-12 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Industries We Serve"
              title="Local businesses with real work to get done."
              description="From field teams to front desks, we help service-based and local businesses reduce the admin work that slows everyone down."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, index) => (
              <Reveal delay={index * 0.03} key={industry}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5 shadow-soft">
                  <Users aria-hidden className="size-5 text-accent" />
                  <span className="font-semibold">{industry}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHeading
              eyebrow="Free Process Review"
              title="What happens during your Free Process Review?"
              description="This is not a sales call. It is a practical conversation about where your business is losing time and what can be improved first."
            />
            <Button asChild className="mt-8" size="lg" variant="accent">
              <Link href="/contact">
                Book My Free Process Review
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="p-6">
              <ul className="space-y-4">
                {[
                  "We learn how your business works.",
                  "We identify repetitive tasks.",
                  "We look for opportunities to save time.",
                  "We recommend practical improvements.",
                  "We prioritize quick wins.",
                ].map((item) => (
                  <li className="flex gap-3" key={item}>
                    <CheckCircle2
                      aria-hidden
                      className="mt-1 size-5 shrink-0 text-accent"
                    />
                    <span className="leading-7 text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl bg-secondary p-5 text-primary">
                There are no high-pressure sales tactics, just practical advice
                to help you run your business more efficiently.
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Testimonials"
              title="Less stress. Better organization. More time back."
              description="Representative examples of the outcomes we focus on for North Shore businesses."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Reveal delay={index * 0.05} key={testimonial.name}>
                <Card className="h-full p-6">
                  <HeartHandshake
                    aria-hidden
                    className="mb-6 size-7 text-accent"
                  />
                  <blockquote className="text-lg leading-8 text-foreground">
                    “{testimonial.quote}”
                  </blockquote>
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="FAQ"
              title="Questions busy business owners usually ask first."
            />
          </Reveal>
          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => (
              <Reveal delay={index * 0.03} key={faq.question}>
                <details className="group rounded-2xl border border-border bg-card p-6 shadow-soft open:shadow-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {faq.question}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-accent transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 leading-7 text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-card sm:p-12 lg:p-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
                  Ready for calmer operations?
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
                  Get a practical plan to save hours every week.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-foreground/75">
                  Bring the messy process, the spreadsheet, the inbox problem,
                  or the “we know this could be better” feeling. We will help
                  you find the first useful step.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button asChild size="lg" variant="outline">
                  <Link href="/demo">Try interactive demo</Link>
                </Button>
                <Button asChild size="lg" variant="accent">
                  <Link href="/contact">
                    Book Your Free Process Review
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
