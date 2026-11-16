import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Everything public is crawlable; the API and the admin page aren't.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
