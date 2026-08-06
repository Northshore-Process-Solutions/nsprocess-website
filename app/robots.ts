import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/crm", "/crm/", "/demo", "/demo/"],
    },
    sitemap: "https://nsprocess.com/sitemap.xml",
  };
}
