import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      aria-label="North Shore Process Solutions home"
      className={cn(
        "group inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      href="/"
    >
      <span className="relative h-12 w-14 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-border transition-transform duration-200 group-hover:-translate-y-0.5">
        <Image
          alt=""
          className="scale-[2.35] object-contain"
          fill
          priority
          sizes="56px"
          src="/transparentLogo.png"
        />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight text-foreground">
          North Shore
        </span>
        <span className="block text-xs font-medium text-muted-foreground">
          Process Solutions
        </span>
      </span>
    </Link>
  );
}
