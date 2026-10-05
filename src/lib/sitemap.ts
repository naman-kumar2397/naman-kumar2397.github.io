import { caseStudies } from '../data/caseStudies.ts';

/** Indexable pages, generated from data so new case studies are never missing from the sitemap. */
export function sitemapPaths(): string[] {
  return ['/', '/resume/', ...caseStudies.filter((c) => c.feature).map((c) => `/projects/${c.id}/`)];
}
