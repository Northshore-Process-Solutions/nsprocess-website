import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
