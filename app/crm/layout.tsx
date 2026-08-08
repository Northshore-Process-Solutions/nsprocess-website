import type { Metadata } from "next";
import type React from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { PortalProvider } from "@/components/portal/portal-provider";
import { getAppBrand } from "@/lib/app-brand";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getAppBrand();
  return {
    title: brand.portalName,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getAppBrand();

  return (
    <PortalProvider brand={brand} mode="live">
      <AdminShell>{children}</AdminShell>
    </PortalProvider>
  );
}
