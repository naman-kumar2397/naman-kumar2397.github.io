import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface Tool {
  id: string;
  label: string;
  category: string;
}

interface Catalog {
  themes: { id: string; label: string }[];
  tools: Tool[];
}

interface Project {
  id: string;
  title: string;
  solution: {
    tools: string[];
  };
}

interface CompanyData {
  company: { id: string };
  projects: Project[];
}

describe("Catalog consistency", () => {
  const dataDir = path.resolve(__dirname, "../src/data");
  const catalogPath = path.join(dataDir, "catalog.yaml");

  // Load catalog
  const catalogContent = fs.readFileSync(catalogPath, "utf-8");
  const catalog = yaml.load(catalogContent) as Catalog;
  const catalogToolIds = new Set(catalog.tools.map((t) => t.id));

  // Find all company YAML files (exclude catalog.yaml)
  const companyFiles = fs.readdirSync(dataDir).filter((f) => {
    return f.endsWith(".yaml") && f !== "catalog.yaml";
  });

  it("catalog.yaml should have unique tool ids", () => {
    const ids = catalog.tools.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("catalog.yaml tools should be sorted alphabetically by id", () => {
    const ids = catalog.tools.map((t) => t.id);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  // Dynamic test for each company file
  for (const file of companyFiles) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const data = yaml.load(content) as CompanyData;

    if (!data.projects) continue;

    describe(`${file}`, () => {
      for (const project of data.projects) {
        const tools = project.solution?.tools ?? [];

        it(`project "${project.id}" tools should all exist in catalog`, () => {
          const missingTools = tools.filter((t) => !catalogToolIds.has(t));
          expect(
            missingTools,
            `Missing tools in catalog: ${missingTools.join(", ")}`
          ).toEqual([]);
        });
      }
    });
  }

  it("should have at least one company YAML file", () => {
    expect(companyFiles.length).toBeGreaterThan(0);
  });

  it("all referenced tools across all projects should exist in catalog", () => {
    const allReferencedTools = new Set<string>();

    for (const file of companyFiles) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data = yaml.load(content) as CompanyData;

      if (!data.projects) continue;

      for (const project of data.projects) {
        const tools = project.solution?.tools ?? [];
        tools.forEach((t) => allReferencedTools.add(t));
      }
    }

    const missingTools = [...allReferencedTools].filter(
      (t) => !catalogToolIds.has(t)
    );
    expect(
      missingTools,
      `Tools referenced but not in catalog: ${missingTools.join(", ")}`
    ).toEqual([]);
  });
});
