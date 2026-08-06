"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  consumeDemoSkipEnd,
  shouldSkipDemoEnd,
} from "@/components/demo/demo-session-flags";

const END_URL = "/api/demo/end";

function endDemoBeacon() {
  if (shouldSkipDemoEnd()) return;

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(END_URL);
      return;
    }
  } catch {
    // fall through
  }

  void fetch(END_URL, {
    method: "POST",
    keepalive: true,
    credentials: "same-origin",
  });
}

/**
 * Wipes the Supabase demo session when the visitor leaves the demo:
 * tab/window close, refresh, or navigating off `/demo/*`.
 */
export function DemoSessionCleanup() {
  const pathname = usePathname() ?? "";
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    // Clear one-shot skip after landing on a fresh build.
    consumeDemoSkipEnd();

    function onPageHide(event: PageTransitionEvent) {
      if (event.persisted) return;
      if (shouldSkipDemoEnd()) return;
      endDemoBeacon();
    }

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);

      const stillOnDemo = pathnameRef.current.startsWith("/demo");
      if (!stillOnDemo && !shouldSkipDemoEnd()) {
        endDemoBeacon();
      }
    };
  }, []);

  return null;
}
