import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = appConfig.url;
  const lastModified = new Date();

  const routes = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/security`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/download`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  return routes;
}
