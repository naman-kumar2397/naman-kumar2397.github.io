import { getProjectSlugs, getProjectMDX } from "@/lib/mdx-loader";
import { loadAllPortfolios } from "@/lib/data-loader";
import { ProjectPage } from "@/components/ProjectPage";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const SITE_URL = "https://naman-kumar2397.github.io";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const slugs = getProjectSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const mdxData = getProjectMDX(id);
  if (!mdxData) return {};

  const title = (mdxData.frontmatter.title as string) || id;
  const description = `Deep-dive case study: ${title}. Explore the problem, solution, architecture, and results.`;
  const url = `${SITE_URL}/project/${id}/`;

  return {
    title,
    description,
    alternates: { canonical: `/project/${id}/` },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [
        {
          url: "/profile.jpeg",
          width: 800,
          height: 800,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/profile.jpeg"],
    },
  };
}

export default async function ProjectDeepDive({ params }: PageProps) {
  const { id } = await params;
  const mdxData = getProjectMDX(id);
  if (!mdxData) notFound();

  const { portfolios, catalog } = loadAllPortfolios();
  // Find which portfolio/project this belongs to
  let companyId = "";
  let projectTitle = "";
  for (const p of portfolios) {
    const proj = p.projects.find(
      (pr) => pr.deepDive?.slug === id || pr.id === id
    );
    if (proj) {
      companyId = p.company.id;
      projectTitle = proj.title;
      break;
    }
  }

  const title = (mdxData.frontmatter.title as string) || projectTitle;
  const pageUrl = `${SITE_URL}/project/${id}/`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: pageUrl,
      },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    url: pageUrl,
    author: {
      "@type": "Person",
      name: "Naman Kumar",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Naman Kumar",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <ProjectPage
        slug={id}
        title={title}
        content={mdxData.content}
        companyId={companyId}
        themes={(mdxData.frontmatter.themes as string[]) || []}
        tools={(mdxData.frontmatter.tools as string[]) || []}
        catalog={catalog}
      />
    </>
  );
}
