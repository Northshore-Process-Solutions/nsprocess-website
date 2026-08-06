import type { NextConfig } from "next";

const demoNoStoreHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-store, no-cache, max-age=0, must-revalidate",
  },
  {
    key: "CDN-Cache-Control",
    value: "no-store",
  },
  {
    key: "Vercel-CDN-Cache-Control",
    value: "no-store",
  },
  {
    key: "Vary",
    value: "Cookie",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/demo",
        headers: demoNoStoreHeaders,
      },
      {
        source: "/demo/:path*",
        headers: demoNoStoreHeaders,
      },
      {
        source: "/api/demo/:path*",
        headers: demoNoStoreHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/crm",
        permanent: true,
      },
      {
        source: "/admin/crm",
        destination: "/crm/businesses",
        permanent: true,
      },
      {
        source: "/admin/crm/:path*",
        destination: "/crm/businesses/:path*",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "/crm/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
