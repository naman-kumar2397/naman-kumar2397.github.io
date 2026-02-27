import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/mdx-loader";

export const dynamic = "force-static";

const SITE_URL = "https://naman-kumar2397.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const projectSlugs = getProjectSlugs();

  const projectEntries: MetadataRoute.Sitemap = projectSlugs.map((slug) => ({
    url: `${SITE_URL}/project/${slug}/`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...projectEntries,
  ];
}
