import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Admin CRM",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef4f9_100%)] text-foreground">
      {children}
    </div>
  );
}
