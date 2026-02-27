import { loadAllPortfolios, loadCertifications, loadEducation, loadHighlights } from "@/lib/data-loader";
import { computeLayout } from "@/lib/layout-engine";
import { getProjectMDX } from "@/lib/mdx-loader";
import { HomeView } from "@/components/HomeView";
import type { DeepDiveContent } from "@/components/DeepDiveModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Naman Kumar — Lead Site Reliability Engineer",
  description:
    "Interactive portfolio of Naman Kumar — Lead SRE based in Melbourne, Australia. Explore projects across Kubernetes, cloud reliability, observability, and platform engineering.",
  alternates: {
    canonical: "/",
  },
};

const SITE_URL = "https://naman-kumar2397.github.io";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Naman Kumar",
      jobTitle: "Lead Site Reliability Engineer",
      url: SITE_URL,
      image: `${SITE_URL}/profile.jpeg`,
      sameAs: ["https://www.linkedin.com/in/-namankumar/"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Melbourne",
        addressCountry: "AU",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Naman Kumar Portfolio",
      url: SITE_URL,
      author: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/`,
      url: `${SITE_URL}/`,
      name: "Naman Kumar — Lead Site Reliability Engineer",
      description:
        "Interactive portfolio of Naman Kumar — Lead SRE in Melbourne. Kubernetes, cloud reliability, observability, platform engineering.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#person` },
    },
  ],
} as const;

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeView
        layouts={layouts}
        catalog={catalog}
        deepDiveMap={deepDiveMap}
        certifications={certifications}
        education={education}
        highlights={highlights}
      />
    </>
  );
}
