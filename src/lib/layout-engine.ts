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
  projectSummary: string;
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

/* ── Merge impacts that share the same type within a project ── */

function mergeImpactsByType(rawImpacts: LaneImpact[]): LaneImpact[] {
  if (rawImpacts.length <= 1) return rawImpacts;

  // Group by normalised type (lowercase)
  const groups = new Map<string, LaneImpact[]>();
  for (const imp of rawImpacts) {
    const key = imp.type.toLowerCase() as LaneImpact["type"];
    const arr = groups.get(key) ?? [];
    arr.push(imp);
    groups.set(key, arr);
  }

  // Preserve original type ordering (first-seen order)
  const result: LaneImpact[] = [];
  const seen = new Set<string>();

  for (const imp of rawImpacts) {
    const key = imp.type.toLowerCase() as LaneImpact["type"];
    if (seen.has(key)) continue;
    seen.add(key);

    const group = groups.get(key)!;
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Merge: combine IDs, labels, and metrics (deduped)
      const mergedId = group.map((g) => g.id).join("+");
      const mergedLabels: string[] = [];
      const mergedMetrics: string[] = [];
      const seenLabels = new Set<string>();
      const seenMetrics = new Set<string>();

      for (const g of group) {
        const normLabel = g.label.trim();
        if (!seenLabels.has(normLabel.toLowerCase())) {
          seenLabels.add(normLabel.toLowerCase());
          mergedLabels.push(normLabel);
        }
        for (const m of g.metrics) {
          const normMetric = m.trim();
          if (!seenMetrics.has(normMetric.toLowerCase())) {
            seenMetrics.add(normMetric.toLowerCase());
            mergedMetrics.push(normMetric);
          }
        }
      }

      result.push({
        id: mergedId,
        label: mergedLabels.join("; "),
        type: key,
        metrics: mergedMetrics,
      });
    }
  }

  return result;
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

  const lanes: StarLane[] = projects.map((proj, i) => {
    const rawImpacts: LaneImpact[] = proj.impact_ids
      .map((iid) => impactMap.get(iid))
      .filter(Boolean)
      .map((imp) => ({
        id: imp!.id,
        label: imp!.label,
        type: imp!.type.toLowerCase() as LaneImpact["type"],
        metrics: imp!.metrics,
      }));

    return {
      projectId: proj.id,
      projectTitle: proj.title,
      projectSummary: proj.summary ?? (proj.solution.statement.match(/^[^.!?]+[.!?]/)?.[0] ?? proj.solution.statement),
      deepDiveSlug: proj.deepDive?.enabled ? proj.deepDive.slug : undefined,
      problemId: proj.problem.id,
      problemText: proj.problem.statement,
      solutionId: proj.solution.id,
      solutionText: proj.solution.statement,
      tools: proj.solution.tools,
      impacts: mergeImpactsByType(rawImpacts),
      themes: proj.themes,
      index: i,
    };
  });

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
