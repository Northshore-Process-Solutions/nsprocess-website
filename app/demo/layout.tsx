import type { Metadata } from "next";
import type React from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { PortalProvider } from "@/components/portal/portal-provider";
import {
  getDemoSession,
  getDemoSessionIdFromCookie,
} from "@/lib/demo/session";

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
  const sessionId = await getDemoSessionIdFromCookie();
  const session = sessionId ? await getDemoSession(sessionId) : null;
  const businessName =
    session?.seed?.business?.name ??
    session?.intake?.businessName ??
    undefined;
  const subtitle = businessName ? `Demo · ${businessName}` : "Demo";

  return (
    <PortalProvider mode="demo">
      <AdminShell subtitle={subtitle}>{children}</AdminShell>
    </PortalProvider>
  );
}
