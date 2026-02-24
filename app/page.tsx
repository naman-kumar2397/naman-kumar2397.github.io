import { loadAllPortfolios, loadCertifications, loadEducation, loadHighlights } from "@/lib/data-loader";
import { computeLayout } from "@/lib/layout-engine";
import { getProjectMDX } from "@/lib/mdx-loader";
import { HomeView } from "@/components/HomeView";
import type { DeepDiveContent } from "@/components/DeepDiveModal";

export default function HomePage() {
  const { portfolios, catalog } = loadAllPortfolios();
  const layouts = portfolios.map((p) => computeLayout(p));
  const certifications = loadCertifications();
  const education = loadEducation();
  const highlights = loadHighlights();

  /* Pre-load all deep-dive MDX content at build time */
  const deepDiveMap: Record<string, DeepDiveContent> = {};
  for (const portfolio of portfolios) {
    for (const project of portfolio.projects) {
      if (project.deepDive?.enabled && project.deepDive.slug) {
        const mdx = getProjectMDX(project.deepDive.slug);
        if (mdx) {
          deepDiveMap[project.deepDive.slug] = {
            slug: mdx.slug,
            title: (mdx.frontmatter.title as string) || project.title,
            content: mdx.content,
            themes: (mdx.frontmatter.themes as string[]) || [],
            tools: (mdx.frontmatter.tools as string[]) || [],
            impactSnapshot: (mdx.frontmatter.impactSnapshot as string[]) || [],
          };
        }
      }
    }
  }

  return (
    <HomeView
      layouts={layouts}
      catalog={catalog}
      deepDiveMap={deepDiveMap}
      certifications={certifications}
      education={education}
      highlights={highlights}
    />
  );
}
