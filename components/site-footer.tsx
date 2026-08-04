import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Logo className="[&_*]:text-primary-foreground" />
          <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/75">
            Helping small businesses across Massachusetts&apos; North Shore get
            their time back with practical process improvement, AI, and
            automation.
          </p>
          <Button asChild className="mt-6" variant="accent">
            <Link href="/contact">
              Book a Free Process Review
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
            Explore
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              ["Services", "/services"],
              ["About", "/about"],
              ["Resources", "/resources"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link
                  className="text-primary-foreground/75 transition hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
            Contact
          </h2>
          <ul className="mt-5 space-y-4 text-sm text-primary-foreground/75">
            <li className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
              Massachusetts North Shore
            </li>
            <li className="flex gap-3">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0" />
              (978) 555-0184
            </li>
            <li className="flex gap-3">
              <Mail aria-hidden className="mt-0.5 size-4 shrink-0" />
              hello@nsprocess.com
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-sm text-primary-foreground/60">
        © 2026 North Shore Process Solutions. All rights reserved.
      </div>
    </footer>
  );
}
