import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nsprocess.com"),
  title: {
    default:
      "North Shore Process Solutions | Helping Small Businesses Get Their Time Back",
    template: "%s | North Shore Process Solutions",
  },
  description:
    "Business efficiency consulting, workflow automation, and practical AI for small businesses across Massachusetts' North Shore.",
  keywords: [
    "Business Process Improvement",
    "Business Efficiency Consulting",
    "Workflow Automation",
    "Small Business Automation",
    "AI Consulting for Small Businesses",
    "Process Improvement Consultant",
    "Business Automation Consultant",
    "North Shore Massachusetts",
    "Small Business Technology Consulting",
  ],
  openGraph: {
    title: "North Shore Process Solutions",
    description:
      "We help small businesses get their time back by automating busywork and improving the way work gets done.",
    url: "https://nsprocess.com",
    siteName: "North Shore Process Solutions",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/transparentLogo.png", type: "image/png" }],
    apple: "/transparentLogo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2545",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
