import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Lightbulb } from "lucide-react";

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
import { services } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Business process reviews, workflow automation, practical AI consulting, CRM implementation, digital forms, dashboards, and technology strategy for North Shore small businesses.",
  alternates: {
    canonical: "/services",
  },
};

export default function ServicesPage() {
  return (
    <main>
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                Services
              </p>
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                Practical ways to save time, reduce stress, and run a more
                organized business.
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                Every service starts with the same question: how does this save
                you time? We help you improve the way work gets done with the
                right mix of process review, automation, AI, documentation, and
                everyday business tools.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="accent">
                  <Link href="/contact">
                    Book Your Free Process Review
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#service-list">View Services</a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-primary px-4 py-16 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            {
              title: "We start with operations",
              text: "Before recommending tools, we learn how work actually moves through your business.",
              icon: Lightbulb,
            },
            {
              title: "We prioritize quick wins",
              text: "The first improvements should reduce friction quickly and build confidence with your team.",
              icon: Clock3,
            },
            {
              title: "We keep it practical",
              text: "No unnecessary software, no AI hype, no complicated systems your team will not use.",
              icon: CheckCircle2,
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <Reveal delay={index * 0.05} key={item.title}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/10 p-6">
                  <Icon aria-hidden className="size-7 text-accent" />
                  <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                  <p className="mt-3 leading-7 text-primary-foreground/75">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8" id="service-list">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="What We Can Improve"
              title="A full-service efficiency partner for the work that keeps your business moving."
              description="These services can stand alone or combine into a focused improvement roadmap after your Free Process Review."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {services.map((service, index) => (
              <Reveal delay={(index % 4) * 0.04} key={service.title}>
                <Card className="h-full transition duration-200 hover:-translate-y-1 hover:shadow-card">
                  <CardHeader>
                    <CardTitle>{service.title}</CardTitle>
                    <CardDescription className="text-base leading-7">
                      {service.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-secondary p-4">
                        <p className="text-sm font-semibold text-primary">
                          Why it matters
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {service.why}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-secondary p-4">
                        <p className="text-sm font-semibold text-primary">
                          How it saves time
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {service.saves}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Typical outcomes
                      </p>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                        {service.outcomes.map((outcome) => (
                          <li
                            className="flex gap-2 text-sm leading-6 text-muted-foreground"
                            key={outcome}
                          >
                            <CheckCircle2
                              aria-hidden
                              className="mt-1 size-4 shrink-0 text-accent"
                            />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Example use cases
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {service.examples.map((example) => (
                          <span
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground"
                            key={example}
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-muted p-8 sm:p-12 lg:p-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Not sure which service you need?
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                  That is exactly what the Free Process Review is for. We will
                  help you identify the most useful first step.
                </p>
              </div>
              <Button asChild size="lg" variant="accent">
                <Link href="/contact">
                  Book a Free Process Review
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
