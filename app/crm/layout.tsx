import type { Metadata } from "next";
import type React from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { PortalProvider } from "@/components/portal/portal-provider";

export const metadata: Metadata = {
  title: "NSPS Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalProvider mode="live">
      <AdminShell>{children}</AdminShell>
    </PortalProvider>
  );
}
