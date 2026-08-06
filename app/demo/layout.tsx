import type { Metadata } from "next";
import type React from "react";
import { connection } from "next/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { DemoSessionCleanup } from "@/components/demo/demo-session-cleanup";
import { PortalProvider } from "@/components/portal/portal-provider";
import {
  getDemoSession,
  getDemoSessionIdFromCookie,
} from "@/lib/demo/session";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NSPS Portal Demo",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Opt out of any static/CDN reuse for personalized demo pages.
  await connection();

  const sessionId = await getDemoSessionIdFromCookie();
  const session = sessionId ? await getDemoSession(sessionId) : null;
  const businessName =
    session?.seed?.business?.name ??
    session?.intake?.businessName ??
    undefined;
  const subtitle = businessName ? `Demo · ${businessName}` : "Demo";

  return (
    <PortalProvider mode="demo">
      <DemoSessionCleanup />
      <AdminShell subtitle={subtitle}>{children}</AdminShell>
    </PortalProvider>
  );
}
