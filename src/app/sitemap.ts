import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/waddle`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/rpeng`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/rpeng/wiki`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
