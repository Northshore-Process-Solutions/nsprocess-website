import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Handshake, MapPin, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "North Shore Process Solutions is a local business efficiency partner helping small businesses reclaim time through smarter processes, practical AI, and automation.",
  alternates: {
    canonical: "/about",
  },
};

const principles = [
  {
    title: "Technology is the tool, not the product",
    text: "The goal is not to add more software. The goal is to make the business easier to run.",
    icon: Compass,
  },
  {
    title: "Local businesses deserve practical advice",
    text: "Small businesses need clear recommendations that fit their team, budget, and daily reality.",
    icon: MapPin,
  },
  {
    title: "Trust comes before implementation",
    text: "We explain tradeoffs in plain English and recommend only what saves time or reduces friction.",
    icon: ShieldCheck,
  },
  {
    title: "Long-term partnership beats one-off projects",
    text: "As your business changes, your processes should keep improving with it.",
    icon: Handshake,
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal>
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                About North Shore Process Solutions
              </p>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                Helping local businesses use modern tools without making work
                more complicated.
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                Most small businesses do not need expensive custom software or
                a shelf full of new subscriptions. They need someone who
                understands business operations, today&apos;s technology, and
                the pressure owners feel when every process depends on them.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="overflow-hidden p-6">
              <div className="rounded-[1.5rem] bg-primary p-8 text-primary-foreground">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
                  Our promise
                </p>
                <blockquote className="mt-4 text-3xl font-bold leading-tight">
                  We give you back hours every week by automating the busywork
                  that&apos;s slowing your business down.
                </blockquote>
                <p className="mt-6 leading-7 text-primary-foreground/75">
                  Business owners do not buy automation. They buy more time,
                  less stress, better organization, and the ability to focus on
                  customers instead of administrative work.
                </p>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Our Story"
              title="A business efficiency partner for the work behind the work."
              description="Behind every customer experience is a set of internal steps: intake, scheduling, communication, documentation, follow-up, billing, reporting, and handoffs. When those steps are messy, owners feel it first."
            />
          </Reveal>
          <div className="mt-10 grid gap-8 text-lg leading-8 text-muted-foreground lg:grid-cols-2">
            <Reveal>
              <p>
                North Shore Process Solutions was created to help local
                businesses modernize without turning operations into a giant
                technology project. We focus on the practical places where time
                disappears: duplicate entry, paper forms, spreadsheet tracking,
                missed follow-up, manual reports, and processes that only live
                in one person&apos;s head.
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p>
                Our role is to be the person in your corner who can translate
                business frustration into a better way of working. Sometimes
                that means automation. Sometimes it means a cleaner CRM, a
                better form, a documented procedure, or a dashboard. The tool
                changes. The promise stays the same: give the business owner
                time back.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="How We Think"
              title="Clear, practical, and built around your actual business."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle, index) => {
              const Icon = principle.icon;

              return (
                <Reveal delay={index * 0.05} key={principle.title}>
                  <Card className="h-full p-6">
                    <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-accent">
                      <Icon aria-hidden className="size-6" />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold">
                      {principle.title}
                    </h2>
                    <p className="mt-3 leading-7 text-muted-foreground">
                      {principle.text}
                    </p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-12 lg:p-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                  Let&apos;s make your business easier to run.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-foreground/75">
                  Start with a Free Process Review and walk away with practical
                  ideas for saving time, even if we never work together.
                </p>
              </div>
              <Button asChild size="lg" variant="accent">
                <Link href="/contact">
                  Book Your Free Process Review
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
