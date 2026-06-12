import type { MetadataRoute } from "next";

import { fetchSitemapDynamicEntries } from "@/lib/seo/public-fetch";
import { getAbsoluteUrl } from "@/lib/seo/site";

const STATIC_PATHS: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/sortir", priority: 0.9, changeFrequency: "daily" },
  { path: "/places", priority: 0.85, changeFrequency: "weekly" },
  { path: "/creators", priority: 0.8, changeFrequency: "weekly" },
  { path: "/creator-content", priority: 0.8, changeFrequency: "weekly" },
  { path: "/neighborhoods", priority: 0.75, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: getAbsoluteUrl(entry.path),
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const dynamicEntries = await fetchSitemapDynamicEntries();
  return [...staticEntries, ...dynamicEntries];
}
