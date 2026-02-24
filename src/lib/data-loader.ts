import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { PortfolioSchema, PortfolioValidationError } from "@/schema/portfolio.schema";
import type { Portfolio, Tool, Theme } from "@/schema/portfolio.schema";
import { z } from "zod";

const dataDir = path.join(process.cwd(), "src", "data");
const orderConfigPath = path.join(process.cwd(), "portfolio.order.yaml");

/* ── Order Config Schema ── */
const OrderConfigSchema = z.object({
  version: z.number().int().positive(),
  companies: z.array(z.string()).default([]),
  lanes: z.record(z.string(), z.array(z.string())).default({}),
  hide: z.object({
    companies: z.array(z.string()).default([]),
    lanes: z.array(z.string()).default([]),
  }).default({ companies: [], lanes: [] }),
});

export type OrderConfig = z.infer<typeof OrderConfigSchema>;

/* ── Load order config ── */
function loadOrderConfig(): OrderConfig {
  if (!fs.existsSync(orderConfigPath)) {
    // Return default config if file doesn't exist
    return { version: 1, companies: [], lanes: {}, hide: { companies: [], lanes: [] } };
  }
  const raw = fs.readFileSync(orderConfigPath, "utf-8");
  const parsed = yaml.load(raw);
  return OrderConfigSchema.parse(parsed);
}

/* ── Validate order config against loaded portfolios ── */
function validateOrderConfig(config: OrderConfig, portfolioMap: Map<string, Portfolio>): void {
  const knownCompanyIds = new Set(portfolioMap.keys());

  // Check for duplicate company IDs in ordering
  const seenCompanies = new Set<string>();
  for (const cid of config.companies) {
    if (seenCompanies.has(cid)) {
      throw new PortfolioValidationError(
        "DUPLICATE_ORDER_COMPANY",
        `Company ID "${cid}" appears multiple times in portfolio.order.yaml companies list`,
        { companyId: cid }
      );
    }
    seenCompanies.add(cid);
  }

  // Check company IDs exist (only for companies that have data files)
  for (const cid of config.companies) {
    if (!knownCompanyIds.has(cid)) {
      // Only warn if company is not in hide list (allows placeholder entries)
      if (!config.hide.companies.includes(cid)) {
        // This is a soft warning - company may be a placeholder for future
        console.warn(`[portfolio.order.yaml] Company "${cid}" listed but no YAML found in src/data/`);
      }
    }
  }

  // Check hidden company IDs don't cause issues
  for (const cid of config.hide.companies) {
    if (seenCompanies.has(cid) && !knownCompanyIds.has(cid)) {
      // Trying to hide a non-existent company that's also in order list - ignore
    }
  }

  // Validate lane ordering per company
  for (const [companyId, projectIds] of Object.entries(config.lanes)) {
    const portfolio = portfolioMap.get(companyId);
    if (!portfolio) {
      // Company doesn't have data yet - skip validation (placeholder)
      continue;
    }

    const knownProjectIds = new Set(portfolio.projects.map((p) => p.id));

    // Check for duplicate project IDs in lane ordering
    const seenProjects = new Set<string>();
    for (const pid of projectIds) {
      if (seenProjects.has(pid)) {
        throw new PortfolioValidationError(
          "DUPLICATE_ORDER_LANE",
          `Project ID "${pid}" appears multiple times in portfolio.order.yaml lanes.${companyId}`,
          { companyId, projectId: pid }
        );
      }
      seenProjects.add(pid);

      // Check project exists in company
      if (!knownProjectIds.has(pid) && !config.hide.lanes.includes(pid)) {
        throw new PortfolioValidationError(
          "UNKNOWN_LANE_IN_ORDER",
          `Project ID "${pid}" in portfolio.order.yaml lanes.${companyId} does not exist in ${companyId}.yaml`,
          { companyId, projectId: pid, knownProjects: Array.from(knownProjectIds) }
        );
      }
    }
  }

  // Check hidden lane IDs exist somewhere
  for (const pid of config.hide.lanes) {
    let found = false;
    for (const portfolio of portfolioMap.values()) {
      if (portfolio.projects.some((p) => p.id === pid)) {
        found = true;
        break;
      }
    }
    if (!found) {
      console.warn(`[portfolio.order.yaml] Hidden lane "${pid}" not found in any company`);
    }
  }
}

/* ── Apply ordering to portfolios ── */
function applyOrdering(portfolioMap: Map<string, Portfolio>, config: OrderConfig): Portfolio[] {
  const hiddenCompanies = new Set(config.hide.companies);
  const hiddenLanes = new Set(config.hide.lanes);

  // Get all company IDs that have data
  const allCompanyIds = Array.from(portfolioMap.keys());

  // Order companies: listed first (in order), then unlisted (stable order)
  const listedCompanies = config.companies.filter((cid) => portfolioMap.has(cid) && !hiddenCompanies.has(cid));
  const unlistedCompanies = allCompanyIds.filter((cid) => !config.companies.includes(cid) && !hiddenCompanies.has(cid));
  const orderedCompanyIds = [...listedCompanies, ...unlistedCompanies];

  // Build ordered portfolios with ordered projects
  const result: Portfolio[] = [];
  for (const companyId of orderedCompanyIds) {
    const portfolio = portfolioMap.get(companyId)!;

    // Filter hidden lanes
    const visibleProjects = portfolio.projects.filter((p) => !hiddenLanes.has(p.id));

    // Order projects within company
    const laneOrder = config.lanes[companyId] || [];
    const listedProjects = laneOrder
      .filter((pid) => visibleProjects.some((p) => p.id === pid))
      .map((pid) => visibleProjects.find((p) => p.id === pid)!);
    const unlistedProjects = visibleProjects.filter((p) => !laneOrder.includes(p.id));
    const orderedProjects = [...listedProjects, ...unlistedProjects];

    // Filter impacts to only those referenced by visible projects
    const referencedImpactIds = new Set(orderedProjects.flatMap((p) => p.impact_ids));
    const visibleImpacts = portfolio.impacts.filter((imp) => referencedImpactIds.has(imp.id));

    // Filter edges to only those involving visible projects
    const visibleProjectIds = new Set(orderedProjects.map((p) => p.id));
    const visibleEdges = portfolio.edges.filter((e) => {
      // Keep company->project, project->problem/solution, and project->impact edges
      if (e.from === companyId) return visibleProjectIds.has(e.to);
      if (visibleProjectIds.has(e.from)) return true;
      return false;
    });

    result.push({
      ...portfolio,
      projects: orderedProjects,
      impacts: visibleImpacts,
      edges: visibleEdges,
    });
  }

  return result;
}

export function loadPortfolio(filename: string): Portfolio {
  const raw = fs.readFileSync(path.join(dataDir, filename), "utf-8");
  const parsed = yaml.load(raw);
  return PortfolioSchema.parse(parsed);
}

const CatalogSchema = z.object({
  themes: z.array(
    z.object({ id: z.string(), label: z.string() })
  ),
  tools: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      category: z.enum([
        "cloud", "iac", "observability", "incident",
        "security", "language", "platform", "collaboration",
        "data", "integration", "other",
      ]),
    })
  ),
});

export type Catalog = z.infer<typeof CatalogSchema>;

export function loadCatalog(): Catalog {
  const raw = fs.readFileSync(path.join(dataDir, "catalog.yaml"), "utf-8");
  const parsed = yaml.load(raw);
  return CatalogSchema.parse(parsed);
}

/** Validate uniqueness across multiple portfolios */
function validateCrossPortfolioUniqueness(portfolios: Portfolio[]): void {
  const seenProjects = new Map<string, string>(); // id -> company
  const seenImpacts = new Map<string, string>();
  const seenProblems = new Map<string, string>();
  const seenSolutions = new Map<string, string>();

  for (const p of portfolios) {
    const company = p.company.id;

    // Project IDs
    for (const proj of p.projects) {
      if (seenProjects.has(proj.id)) {
        throw new PortfolioValidationError(
          "CROSS_DUPLICATE_PROJECT_ID",
          `Project ID "${proj.id}" exists in both "${seenProjects.get(proj.id)}" and "${company}"`,
          { id: proj.id, companies: [seenProjects.get(proj.id), company] }
        );
      }
      seenProjects.set(proj.id, company);

      // Problem IDs
      if (seenProblems.has(proj.problem.id)) {
        throw new PortfolioValidationError(
          "CROSS_DUPLICATE_PROBLEM_ID",
          `Problem ID "${proj.problem.id}" exists in both "${seenProblems.get(proj.problem.id)}" and "${company}"`,
          { id: proj.problem.id, companies: [seenProblems.get(proj.problem.id), company] }
        );
      }
      seenProblems.set(proj.problem.id, company);

      // Solution IDs
      if (seenSolutions.has(proj.solution.id)) {
        throw new PortfolioValidationError(
          "CROSS_DUPLICATE_SOLUTION_ID",
          `Solution ID "${proj.solution.id}" exists in both "${seenSolutions.get(proj.solution.id)}" and "${company}"`,
          { id: proj.solution.id, companies: [seenSolutions.get(proj.solution.id), company] }
        );
      }
      seenSolutions.set(proj.solution.id, company);
    }

    // Impact IDs
    for (const imp of p.impacts) {
      if (seenImpacts.has(imp.id)) {
        throw new PortfolioValidationError(
          "CROSS_DUPLICATE_IMPACT_ID",
          `Impact ID "${imp.id}" exists in both "${seenImpacts.get(imp.id)}" and "${company}"`,
          { id: imp.id, companies: [seenImpacts.get(imp.id), company] }
        );
      }
      seenImpacts.set(imp.id, company);
    }
  }
}

export function loadAllPortfolios(): { portfolios: Portfolio[]; catalog: Catalog } {
  const catalog = loadCatalog();

  // Load all company YAML files dynamically (excluding catalog.yaml)
  const allFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith(".yaml") && f !== "catalog.yaml");
  const rawPortfolios = allFiles.map((f) => loadPortfolio(f));

  // Build portfolio map keyed by company id
  const portfolioMap = new Map<string, Portfolio>();
  for (const p of rawPortfolios) {
    portfolioMap.set(p.company.id, p);
  }

  // Load and validate order config
  const orderConfig = loadOrderConfig();
  validateOrderConfig(orderConfig, portfolioMap);

  // Apply ordering and filtering
  const portfolios = applyOrdering(portfolioMap, orderConfig);

  // Validate cross-portfolio uniqueness
  validateCrossPortfolioUniqueness(portfolios);

  return { portfolios, catalog };
}
