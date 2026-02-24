import { z } from "zod";
import fs from "fs";
import path from "path";

/**
 * Portfolio data schema (YAML-backed).
 * Keep IDs stable; UI routes and deep links depend on them.
 */

/* ── Custom Error Class ── */
export class PortfolioValidationError extends Error {
  constructor(
    public readonly rule: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(`[${rule}] ${message}`);
    this.name = "PortfolioValidationError";
  }
}

/* ── Helper: Check file exists ── */
function mdxFileExists(slug: string): boolean {
  const mdxPath = path.join(process.cwd(), "src", "content", "projects", `${slug}.mdx`);
  try {
    return fs.existsSync(mdxPath);
  } catch {
    return false;
  }
}

/* ── Base Schemas ── */
export const ThemeId = z.string().min(2);
export const ToolId = z.string().min(2);
export const ImpactId = z.string().min(2);

export const ToolSchema = z.object({
  id: ToolId,
  label: z.string().min(2),
  category: z.enum(["cloud", "iac", "observability", "incident", "security", "language", "platform", "collaboration", "data", "integration", "other"]),
});

export const ThemeSchema = z.object({
  id: ThemeId,
  label: z.string().min(2),
});

export const ImpactSchema = z.object({
  id: ImpactId,
  label: z.string().min(4),
  type: z.enum(["reliability", "observability", "scalability", "security"]),
  metrics: z.array(z.string()).default([]),
});

export const ProblemSchema = z.object({
  id: z.string().min(2),
  statement: z.string().min(10),
});

export const SolutionSchema = z.object({
  id: z.string().min(2),
  statement: z.string().min(10),
  tools: z.array(ToolId).default([]),
});

export const ProjectSchema = z.object({
  id: z.string().min(2),
  title: z.string().min(4),
  themes: z.array(ThemeId).default([]),
  problem: ProblemSchema,
  solution: SolutionSchema,
  impact_ids: z.array(ImpactId).default([]),
  deepDive: z.object({
    enabled: z.boolean().default(false),
    slug: z.string().optional(), // e.g., "prj-s3-remediation"
  }).default({ enabled: false }),
});

export const CompanySchema = z.object({
  id: z.string().min(2),
  label: z.string().min(2),
  role: z.string().min(2),
  period: z.string().min(2),
  tags: z.array(z.string()).default([]),
  people_scope: z.object({
    team_size: z.number().int().nonnegative().optional(),
    team_model: z.string().optional(),
  }).default({}),
});

export const EdgeSchema = z.object({
  from: z.string().min(2),
  to: z.string().min(2),
  rel: z.enum(["owns", "has_problem", "has_solution", "solved_by", "drives"]),
});

/* ── Raw Portfolio Schema (before custom validation) ── */
const RawPortfolioSchema = z.object({
  company: CompanySchema,
  impacts: z.array(ImpactSchema),
  projects: z.array(ProjectSchema),
  edges: z.array(EdgeSchema),
});

type RawPortfolio = z.infer<typeof RawPortfolioSchema>;

/* ── Validation Functions ── */

/** Find duplicate IDs in an array */
function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const id of ids) {
    if (seen.has(id) && !dupes.includes(id)) {
      dupes.push(id);
    }
    seen.add(id);
  }
  return dupes;
}

/** Validate uniqueness of all IDs */
export function validateUniqueness(data: RawPortfolio): void {
  // Project IDs
  const projectIds = data.projects.map((p) => p.id);
  const dupeProjects = findDuplicates(projectIds);
  if (dupeProjects.length > 0) {
    throw new PortfolioValidationError(
      "DUPLICATE_PROJECT_ID",
      `Duplicate project IDs found: ${dupeProjects.join(", ")}`,
      { duplicates: dupeProjects }
    );
  }

  // Impact IDs
  const impactIds = data.impacts.map((i) => i.id);
  const dupeImpacts = findDuplicates(impactIds);
  if (dupeImpacts.length > 0) {
    throw new PortfolioValidationError(
      "DUPLICATE_IMPACT_ID",
      `Duplicate impact IDs found: ${dupeImpacts.join(", ")}`,
      { duplicates: dupeImpacts }
    );
  }

  // Problem IDs
  const problemIds = data.projects.map((p) => p.problem.id);
  const dupeProblems = findDuplicates(problemIds);
  if (dupeProblems.length > 0) {
    throw new PortfolioValidationError(
      "DUPLICATE_PROBLEM_ID",
      `Duplicate problem IDs found: ${dupeProblems.join(", ")}`,
      { duplicates: dupeProblems }
    );
  }

  // Solution IDs
  const solutionIds = data.projects.map((p) => p.solution.id);
  const dupeSolutions = findDuplicates(solutionIds);
  if (dupeSolutions.length > 0) {
    throw new PortfolioValidationError(
      "DUPLICATE_SOLUTION_ID",
      `Duplicate solution IDs found: ${dupeSolutions.join(", ")}`,
      { duplicates: dupeSolutions }
    );
  }
}

/** Validate all edges reference existing nodes */
export function validateEdgeIntegrity(data: RawPortfolio): void {
  // Build set of all valid node IDs
  const validIds = new Set<string>();
  validIds.add(data.company.id);
  for (const p of data.projects) {
    validIds.add(p.id);
    validIds.add(p.problem.id);
    validIds.add(p.solution.id);
  }
  for (const i of data.impacts) {
    validIds.add(i.id);
  }

  // Check each edge
  for (const edge of data.edges) {
    if (!validIds.has(edge.from)) {
      throw new PortfolioValidationError(
        "BROKEN_EDGE",
        `Edge references unknown 'from' node: "${edge.from}" → "${edge.to}" (rel: ${edge.rel})`,
        { edge, knownIds: Array.from(validIds) }
      );
    }
    if (!validIds.has(edge.to)) {
      throw new PortfolioValidationError(
        "BROKEN_EDGE",
        `Edge references unknown 'to' node: "${edge.from}" → "${edge.to}" (rel: ${edge.rel})`,
        { edge, knownIds: Array.from(validIds) }
      );
    }
  }
}

/** Validate deepDive configuration */
export function validateDeepDive(data: RawPortfolio): void {
  for (const project of data.projects) {
    if (project.deepDive.enabled) {
      if (!project.deepDive.slug) {
        throw new PortfolioValidationError(
          "MISSING_DEEPDIVE_SLUG",
          `Project "${project.id}" has deepDive.enabled=true but no slug specified`,
          { projectId: project.id }
        );
      }
      if (!mdxFileExists(project.deepDive.slug)) {
        throw new PortfolioValidationError(
          "MISSING_MDX_FILE",
          `Project "${project.id}" references MDX slug "${project.deepDive.slug}" but file not found at src/content/projects/${project.deepDive.slug}.mdx`,
          { projectId: project.id, slug: project.deepDive.slug }
        );
      }
    }
  }
}

/** Normalize tools: lowercase, trim, deduplicate */
export function normalizeTools(data: RawPortfolio): RawPortfolio {
  return {
    ...data,
    projects: data.projects.map((project) => ({
      ...project,
      solution: {
        ...project.solution,
        tools: [...new Set(project.solution.tools.map((t) => t.toLowerCase().trim()))],
      },
    })),
  };
}

/** Run all validations and return normalized data */
export function validateAndNormalize(data: RawPortfolio): RawPortfolio {
  validateUniqueness(data);
  validateEdgeIntegrity(data);
  validateDeepDive(data);
  return normalizeTools(data);
}

/* ── Final Portfolio Schema with Custom Validation ── */
export const PortfolioSchema = RawPortfolioSchema.transform((data) => {
  return validateAndNormalize(data);
});

export type Portfolio = z.infer<typeof PortfolioSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Impact = z.infer<typeof ImpactSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
