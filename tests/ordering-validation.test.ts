import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

/* ── Types ── */
interface OrderConfig {
  version: number;
  companies: string[];
  lanes: Record<string, string[]>;
  hide: {
    companies: string[];
    lanes: string[];
  };
}

interface CompanyData {
  company: { id: string };
  projects: { id: string; title: string }[];
}

/* ── Helpers ── */
const dataDir = path.resolve(__dirname, "../src/data");
const orderPath = path.resolve(__dirname, "../portfolio.order.yaml");

function loadOrder(): OrderConfig {
  const raw = fs.readFileSync(orderPath, "utf-8");
  return yaml.load(raw) as OrderConfig;
}

function loadCompanyData(filename: string): CompanyData {
  const raw = fs.readFileSync(path.join(dataDir, filename), "utf-8");
  return yaml.load(raw) as CompanyData;
}

function companyFiles(): string[] {
  return fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".yaml") && !["catalog.yaml", "certifications.yaml", "education.yaml", "highlights.yaml"].includes(f));
}

/* ── Tests ── */
describe("portfolio.order.yaml validation", () => {
  const order = loadOrder();
  const files = companyFiles();

  // Build a map: companyId → Set<projectId>
  const companyMap = new Map<string, Set<string>>();
  for (const file of files) {
    const data = loadCompanyData(file);
    const projectIds = new Set((data.projects ?? []).map((p) => p.id));
    companyMap.set(data.company.id, projectIds);
  }

  const knownCompanyIds = new Set(companyMap.keys());
  const hiddenCompanies = new Set(order.hide?.companies ?? []);
  const hiddenLanes = new Set(order.hide?.lanes ?? []);

  /* ── Company-level checks ── */

  it("should reference only companies that have a data YAML file", () => {
    const missing: string[] = [];
    for (const cid of order.companies) {
      if (!knownCompanyIds.has(cid) && !hiddenCompanies.has(cid)) {
        missing.push(cid);
      }
    }
    expect(
      missing,
      `Companies listed in portfolio.order.yaml but no matching YAML in src/data/:\n` +
        missing.map((c) => `  • "${c}" — expected file src/data/${c}.yaml`).join("\n")
    ).toEqual([]);
  });

  it("should not list duplicate company IDs", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const cid of order.companies) {
      if (seen.has(cid)) dupes.push(cid);
      seen.add(cid);
    }
    expect(
      dupes,
      `Duplicate company IDs in portfolio.order.yaml:\n` +
        dupes.map((c) => `  • "${c}"`).join("\n")
    ).toEqual([]);
  });

  it("should include every company data file in the ordering (or hide list)", () => {
    const orderedOrHidden = new Set([...order.companies, ...hiddenCompanies]);
    const untracked: string[] = [];
    for (const cid of knownCompanyIds) {
      if (!orderedOrHidden.has(cid)) {
        untracked.push(cid);
      }
    }
    expect(
      untracked,
      `Company YAML files exist but are not listed in portfolio.order.yaml companies or hide.companies:\n` +
        untracked.map((c) => `  • "${c}" (src/data/${c}.yaml)`).join("\n")
    ).toEqual([]);
  });

  /* ── Lane-level (project) checks ── */

  describe("lane ordering per company", () => {
    for (const [companyId, projectIds] of Object.entries(order.lanes)) {
      describe(`lanes.${companyId}`, () => {
        const companyProjects = companyMap.get(companyId);

        it(`company "${companyId}" should exist in src/data/`, () => {
          // Allow if company is a placeholder with an empty lane list
          if (projectIds.length === 0) return;
          expect(
            companyProjects,
            `Lane ordering references company "${companyId}" but no data file found.\n` +
              `  Known companies: ${[...knownCompanyIds].join(", ")}`
          ).toBeDefined();
        });

        if (companyProjects && projectIds.length > 0) {
          it("should not list duplicate project IDs", () => {
            const seen = new Set<string>();
            const dupes: string[] = [];
            for (const pid of projectIds) {
              if (seen.has(pid)) dupes.push(pid);
              seen.add(pid);
            }
            expect(
              dupes,
              `Duplicate project IDs in lanes.${companyId}:\n` +
                dupes.map((p) => `  • "${p}"`).join("\n")
            ).toEqual([]);
          });

          it("every listed project should exist in the company data", () => {
            const missing: string[] = [];
            for (const pid of projectIds) {
              if (!companyProjects.has(pid) && !hiddenLanes.has(pid)) {
                missing.push(pid);
              }
            }
            expect(
              missing,
              `Projects in portfolio.order.yaml lanes.${companyId} not found in ${companyId}.yaml:\n` +
                missing
                  .map(
                    (p) =>
                      `  • "${p}" — not in [${[...companyProjects].join(", ")}]`
                  )
                  .join("\n")
            ).toEqual([]);
          });

          it("every company project should appear in the lane order (or hide list)", () => {
            const orderedOrHidden = new Set([...projectIds, ...hiddenLanes]);
            const untracked: string[] = [];
            for (const pid of companyProjects) {
              if (!orderedOrHidden.has(pid)) {
                untracked.push(pid);
              }
            }
            expect(
              untracked,
              `Projects in ${companyId}.yaml not tracked in portfolio.order.yaml:\n` +
                untracked
                  .map((p) => `  • "${p}" — add to lanes.${companyId} or hide.lanes`)
                  .join("\n")
            ).toEqual([]);
          });
        }
      });
    }
  });

  /* ── Hidden items sanity ── */

  it("hidden companies should not also appear in the active companies list (ambiguous)", () => {
    const overlap = order.companies.filter((c) => hiddenCompanies.has(c));
    expect(
      overlap,
      `Companies appear in both 'companies' and 'hide.companies':\n` +
        overlap.map((c) => `  • "${c}"`).join("\n")
    ).toEqual([]);
  });
});
