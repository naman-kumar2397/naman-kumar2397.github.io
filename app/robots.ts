import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = "https://naman-kumar2397.github.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
