import { describe, it, expect } from "vitest";
import {
  validateUniqueness,
  validateEdgeIntegrity,
  validateDeepDive,
  normalizeTools,
  PortfolioValidationError,
} from "@/schema/portfolio.schema";

/* ── Minimal valid portfolio fixture ── */
function createMinimalPortfolio() {
  return {
    company: {
      id: "test-co",
      label: "Test Company",
      role: "Engineer",
      period: "2024",
      tags: [],
      people_scope: {},
    },
    impacts: [
      { id: "imp-1", label: "Impact one", type: "reliability" as const, metrics: [] },
    ],
    projects: [
      {
        id: "prj-1",
        title: "Test Project",
        themes: [],
        problem: { id: "p-1", statement: "A real problem statement" },
        solution: { id: "s-1", statement: "A real solution statement", tools: ["AWS", " terraform ", "AWS"] },
        impact_ids: ["imp-1"],
        deepDive: { enabled: false },
      },
    ],
    edges: [
      { from: "test-co", to: "prj-1", rel: "owns" as const },
      { from: "prj-1", to: "p-1", rel: "has_problem" as const },
      { from: "prj-1", to: "s-1", rel: "has_solution" as const },
    ],
  };
}

describe("Portfolio Schema Validation", () => {
  describe("validateUniqueness", () => {
    it("passes for unique IDs", () => {
      const data = createMinimalPortfolio();
      expect(() => validateUniqueness(data)).not.toThrow();
    });

    it("throws DUPLICATE_PROJECT_ID for duplicate project IDs", () => {
      const data = createMinimalPortfolio();
      data.projects.push({
        id: "prj-1", // duplicate
        title: "Duplicate Project",
        themes: [],
        problem: { id: "p-2", statement: "Another problem" },
        solution: { id: "s-2", statement: "Another solution", tools: [] },
        impact_ids: [],
        deepDive: { enabled: false },
      });

      expect(() => validateUniqueness(data)).toThrowError(PortfolioValidationError);
      try {
        validateUniqueness(data);
      } catch (e) {
        expect(e).toBeInstanceOf(PortfolioValidationError);
        expect((e as PortfolioValidationError).rule).toBe("DUPLICATE_PROJECT_ID");
        expect((e as PortfolioValidationError).message).toContain("prj-1");
      }
    });

    it("throws DUPLICATE_IMPACT_ID for duplicate impact IDs", () => {
      const data = createMinimalPortfolio();
      data.impacts.push({ id: "imp-1", label: "Duplicate impact", type: "security", metrics: [] });

      expect(() => validateUniqueness(data)).toThrowError(PortfolioValidationError);
      try {
        validateUniqueness(data);
      } catch (e) {
        expect((e as PortfolioValidationError).rule).toBe("DUPLICATE_IMPACT_ID");
      }
    });

    it("throws DUPLICATE_PROBLEM_ID for duplicate problem IDs", () => {
      const data = createMinimalPortfolio();
      data.projects.push({
        id: "prj-2",
        title: "Another Project",
        themes: [],
        problem: { id: "p-1", statement: "Same problem ID" }, // duplicate
        solution: { id: "s-2", statement: "Another solution", tools: [] },
        impact_ids: [],
        deepDive: { enabled: false },
      });

      expect(() => validateUniqueness(data)).toThrowError(PortfolioValidationError);
      try {
        validateUniqueness(data);
      } catch (e) {
        expect((e as PortfolioValidationError).rule).toBe("DUPLICATE_PROBLEM_ID");
      }
    });
  });

  describe("validateEdgeIntegrity", () => {
    it("passes for valid edges", () => {
      const data = createMinimalPortfolio();
      expect(() => validateEdgeIntegrity(data)).not.toThrow();
    });

    it("throws BROKEN_EDGE for unknown from node", () => {
      const data = createMinimalPortfolio();
      data.edges.push({ from: "unknown-node", to: "prj-1", rel: "owns" });

      expect(() => validateEdgeIntegrity(data)).toThrowError(PortfolioValidationError);
      try {
        validateEdgeIntegrity(data);
      } catch (e) {
        expect(e).toBeInstanceOf(PortfolioValidationError);
        expect((e as PortfolioValidationError).rule).toBe("BROKEN_EDGE");
        expect((e as PortfolioValidationError).message).toContain("unknown-node");
      }
    });

    it("throws BROKEN_EDGE for unknown to node", () => {
      const data = createMinimalPortfolio();
      data.edges.push({ from: "test-co", to: "ghost-project", rel: "owns" });

      expect(() => validateEdgeIntegrity(data)).toThrowError(PortfolioValidationError);
      try {
        validateEdgeIntegrity(data);
      } catch (e) {
        expect((e as PortfolioValidationError).rule).toBe("BROKEN_EDGE");
        expect((e as PortfolioValidationError).message).toContain("ghost-project");
      }
    });
  });

  describe("validateDeepDive", () => {
    it("passes when deepDive is disabled", () => {
      const data = createMinimalPortfolio();
      expect(() => validateDeepDive(data)).not.toThrow();
    });

    it("throws MISSING_DEEPDIVE_SLUG when enabled but no slug", () => {
      const data = createMinimalPortfolio();
      data.projects[0].deepDive = { enabled: true }; // no slug

      expect(() => validateDeepDive(data)).toThrowError(PortfolioValidationError);
      try {
        validateDeepDive(data);
      } catch (e) {
        expect(e).toBeInstanceOf(PortfolioValidationError);
        expect((e as PortfolioValidationError).rule).toBe("MISSING_DEEPDIVE_SLUG");
        expect((e as PortfolioValidationError).message).toContain("prj-1");
      }
    });

    it("throws MISSING_MDX_FILE when slug does not match existing file", () => {
      const data = createMinimalPortfolio();
      data.projects[0].deepDive = { enabled: true, slug: "nonexistent-file" };

      expect(() => validateDeepDive(data)).toThrowError(PortfolioValidationError);
      try {
        validateDeepDive(data);
      } catch (e) {
        expect(e).toBeInstanceOf(PortfolioValidationError);
        expect((e as PortfolioValidationError).rule).toBe("MISSING_MDX_FILE");
        expect((e as PortfolioValidationError).message).toContain("nonexistent-file");
      }
    });

    it("passes when slug matches existing MDX file", () => {
      const data = createMinimalPortfolio();
      data.projects[0].deepDive = { enabled: true, slug: "prj-s3-remediation" };
      expect(() => validateDeepDive(data)).not.toThrow();
    });
  });

  describe("normalizeTools", () => {
    it("lowercases trims and deduplicates tools", () => {
      const data = createMinimalPortfolio();
      data.projects[0].solution.tools = ["AWS", " terraform ", "AWS", "  Python  ", "terraform"];

      const normalized = normalizeTools(data);
      expect(normalized.projects[0].solution.tools).toEqual(["aws", "terraform", "python"]);
    });
  });
});
