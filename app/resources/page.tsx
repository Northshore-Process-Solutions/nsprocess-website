import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Search } from "lucide-react";

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
import { articles } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Practical articles for small business owners on automation, AI, process improvement, CRMs, spreadsheets, and business efficiency.",
  alternates: {
    canonical: "/resources",
  },
};

export default function ResourcesPage() {
  return (
    <main>
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                Resources
              </p>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                Practical advice for owners who want a calmer, more efficient
                business.
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                Plain-English guides on automation, AI, CRMs, spreadsheets, and
                process improvement, written for busy business owners who want
                less admin work and more time back.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Featured Guides"
              title="Start with the work that is costing you the most time."
              description="These placeholder articles are ready for publishing as the resource library grows."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <Reveal delay={index * 0.04} key={article.title}>
                <Card className="flex h-full flex-col transition duration-200 hover:-translate-y-1 hover:shadow-card">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                        {article.tag}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Clock aria-hidden className="size-3.5" />
                        {article.readTime}
                      </span>
                    </div>
                    <CardTitle>{article.title}</CardTitle>
                    <CardDescription className="text-base leading-7">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      href="/contact"
                    >
                      Ask about this topic
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <div>
              <BookOpen aria-hidden className="size-10 text-accent" />
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                Not sure where your biggest time leak is?
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                The best article is useful. The best process review is specific
                to your business.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="p-6 sm:p-8">
              <div className="flex gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-accent">
                  <Search aria-hidden className="size-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">
                    Bring us the messy workflow.
                  </h3>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    We will help identify what is repetitive, what can be
                    simplified, and which improvements will save time first.
                  </p>
                  <Button asChild className="mt-6" variant="accent">
                    <Link href="/contact">
                      Book a Free Process Review
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
