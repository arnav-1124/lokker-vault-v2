import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = appConfig.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features",
          "/security",
          "/privacy",
          "/docs",
          "/download",
          "/favicon.svg",
          "/icon.svg",
          "/opengraph-image",
        ],
        disallow: [
          "/app/",
          "/design/",
          "/_next/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
