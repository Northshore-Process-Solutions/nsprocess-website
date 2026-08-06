import Link from "next/link";

import { endDemoSession } from "@/app/demo/actions";
import { Button } from "@/components/ui/button";

export function DemoShell({
  children,
  businessName,
}: {
  children: React.ReactNode;
  businessName?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f1f3f5] text-foreground">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-12 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <Link
              className="text-sm font-semibold tracking-tight text-slate-900"
              href="/demo/home"
            >
              NSPS Demo
            </Link>
            {businessName ? (
              <p className="truncate text-xs text-slate-500">{businessName}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/contact">Book a real review</Link>
            </Button>
            <form action={endDemoSession}>
              <Button size="sm" type="submit" variant="outline">
                End demo
              </Button>
            </form>
          </div>
        </div>
        <nav
          aria-label="Demo sections"
          className="flex gap-0 overflow-x-auto border-t border-slate-100 px-4 sm:px-6"
        >
          {[
            { href: "/demo/home", label: "Home" },
            { href: "/demo/pipeline", label: "Pipeline" },
            { href: "/demo/business", label: "Business" },
            { href: "/demo/billing", label: "Billing" },
            { href: "/demo/projects", label: "Projects" },
          ].map((link) => (
            <Link
              className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
        Demo sandbox only. Data is private to this browser session and expires
        automatically.
      </footer>
    </div>
  );
}
