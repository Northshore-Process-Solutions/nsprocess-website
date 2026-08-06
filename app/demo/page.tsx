import Link from "next/link";

import { DemoIntakeForm } from "@/components/demo/demo-intake-form";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Interactive CRM Demo",
  robots: { index: false, follow: false },
};

type DemoStartPageProps = {
  searchParams?: Promise<{ expired?: string }>;
};

export default async function DemoStartPage({
  searchParams,
}: DemoStartPageProps) {
  const params = await searchParams;
  const expired = params?.expired === "1";

  return (
    <main className="min-h-screen bg-[#f1f3f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Interactive demo
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Build a private CRM walkthrough for your business
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Tell us a little about the business. AI will populate a sandbox with
          pipeline, billing, and project data shaped around that profile. The
          sandbox is session-private and never touches North Shore Process
          Solutions’ live CRM.
        </p>

        {expired ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            That demo session expired. Start a new one below.
          </div>
        ) : null}

        <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
          <DemoIntakeForm />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Button asChild size="sm" variant="outline">
            <Link href="/">Back to site</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/contact">Book a real Process Review</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
