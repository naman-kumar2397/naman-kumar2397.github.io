/**
 * STAR-lane layout engine.
 *
 * Each project becomes a self-contained horizontal lane:
 *   [PROBLEM] ──→ [SOLUTION] ──→ [IMPACT badges]
 *
 * No cross-project edges in the default overview.
 * Impacts are rendered as inline badge(s) at the lane tail.
 */

import type { Portfolio, Impact } from "@/schema/portfolio.schema";

/* ── Public types ──────────────────────────────────────── */

export type NodeType = "problem" | "solution" | "impact-badge";

export interface LaneImpact {
  id: string;
  label: string;
  type: "reliability" | "observability" | "scalability" | "security";
  metrics: string[];
}

export interface StarLane {
  projectId: string;
  projectTitle: string;
  deepDiveSlug?: string;
  problemId: string;
  problemText: string;
  solutionId: string;
  solutionText: string;
  tools: string[];
  impacts: LaneImpact[];
  themes: string[];
  /** Lane row index (0-based) */
  index: number;
}

export interface StarLayout {
  companyId: string;
  companyLabel: string;
  companyRole: string;
  companyPeriod: string;
  lanes: StarLane[];
  /** Full impact list for the inspector */
  allImpacts: Impact[];
  /** Map: impactId → projectIds that share it */
  impactProjectMap: Record<string, string[]>;
}

/* ── Main layout function ─────────────────────────────── */

export function computeLayout(portfolio: Portfolio): StarLayout {
  const { company, projects, impacts } = portfolio;

  const impactMap = new Map(impacts.map((imp) => [imp.id, imp]));

  // Build reverse map: impactId → projectIds
  const impactProjectMap: Record<string, string[]> = {};
  projects.forEach((proj) => {
    proj.impact_ids.forEach((iid) => {
      if (!impactProjectMap[iid]) impactProjectMap[iid] = [];
      impactProjectMap[iid].push(proj.id);
    });
  });

  const lanes: StarLane[] = projects.map((proj, i) => ({
    projectId: proj.id,
    projectTitle: proj.title,
    deepDiveSlug: proj.deepDive?.enabled ? proj.deepDive.slug : undefined,
    problemId: proj.problem.id,
    problemText: proj.problem.statement,
    solutionId: proj.solution.id,
    solutionText: proj.solution.statement,
    tools: proj.solution.tools,
    impacts: proj.impact_ids
      .map((iid) => impactMap.get(iid))
      .filter(Boolean)
      .map((imp) => ({
        id: imp!.id,
        label: imp!.label,
        type: imp!.type as LaneImpact["type"],
        metrics: imp!.metrics,
      })),
    themes: proj.themes,
    index: i,
  }));

  return {
    companyId: company.id,
    companyLabel: company.label,
    companyRole: company.role,
    companyPeriod: company.period,
    lanes,
    allImpacts: impacts,
    impactProjectMap,
  };
}
