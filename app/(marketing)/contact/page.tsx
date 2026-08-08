import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { Card } from "@/components/ui/card";
import { contact } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Book a Free Process Review",
  description:
    "Book a Free Process Review with North Shore Process Solutions. Get practical advice to save time, reduce busywork, and improve business operations.",
  alternates: {
    canonical: "/contact",
  },
};

const reviewSteps = [
  "Tell us what is taking too much time.",
  "We learn how the work happens today.",
  "We identify bottlenecks and repetitive tasks.",
  "We recommend practical quick wins and next steps.",
];

type ContactPageProps = {
  searchParams?: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const sent = params?.sent === "1";
  const error = params?.error === "1";

  return (
    <main>
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                Book a Free Process Review
              </p>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                Let&apos;s find the busywork that is stealing your time.
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                This is a practical conversation, not a high-pressure sales
                call. We will learn how your business works, look for
                opportunities to save time, and suggest useful next steps.
              </p>
              <div className="mt-8 grid gap-4">
                {reviewSteps.map((step) => (
                  <div className="flex gap-3" key={step}>
                    <CheckCircle2
                      aria-hidden
                      className="mt-1 size-5 shrink-0 text-accent"
                    />
                    <span className="leading-7 text-muted-foreground">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="p-6 sm:p-8">
              <ContactForm error={error} sent={sent} />
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          <Reveal>
            <Card className="h-full p-6">
              <Phone aria-hidden className="size-7 text-accent" />
              <h2 className="mt-5 text-xl font-semibold">Phone</h2>
              <p className="mt-2 text-muted-foreground">
                <a
                  className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`tel:+1${contact.phone.replace(/\D/g, "")}`}
                >
                  {contact.phone}
                </a>
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.05}>
            <Card className="h-full p-6">
              <Mail aria-hidden className="size-7 text-accent" />
              <h2 className="mt-5 text-xl font-semibold">Email</h2>
              <p className="mt-2 text-muted-foreground">
                <a
                  className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`mailto:${contact.email}`}
                >
                  {contact.email}
                </a>
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="h-full p-6">
              <CalendarCheck aria-hidden className="size-7 text-accent" />
              <h2 className="mt-5 text-xl font-semibold">Business Hours</h2>
              <p className="mt-2 text-muted-foreground">{contact.hours}</p>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <SectionHeading
              eyebrow="Service Area"
              title="Serving small businesses across Massachusetts' North Shore."
              description="We work with contractors, trades, healthcare practices, professional services, manufacturers, retailers, restaurants, property managers, and other local service businesses."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
              <div className="relative aspect-[4/3] min-h-80 w-full bg-secondary sm:aspect-[5/4]">
                <iframe
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-71.05%2C42.55%2C-70.70%2C42.95&amp;layer=mapnik&amp;marker=42.8418%2C-70.8606"
                  title="Map pin for Salisbury, Massachusetts North Shore service area"
                />
              </div>
              <div className="flex items-start gap-3 px-5 py-4">
                <MapPin
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-accent"
                />
                <div>
                  <p className="font-semibold text-foreground">
                    Salisbury, MA
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Based on the North Shore and serving small businesses across
                    the region.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
