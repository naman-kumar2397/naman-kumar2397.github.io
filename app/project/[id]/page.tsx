import { getProjectSlugs, getProjectMDX } from "@/lib/mdx-loader";
import { loadAllPortfolios } from "@/lib/data-loader";
import { ProjectPage } from "@/components/ProjectPage";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const slugs = getProjectSlugs();
  return slugs.map((id) => ({ id }));
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

  return (
    <ProjectPage
      slug={id}
      title={mdxData.frontmatter.title as string || projectTitle}
      content={mdxData.content}
      companyId={companyId}
      themes={(mdxData.frontmatter.themes as string[]) || []}
      tools={(mdxData.frontmatter.tools as string[]) || []}
      catalog={catalog}
    />
  );
}
