import { describe, it, expect } from "vitest";
import { groupImpactsByType, IMPACT_TYPE_ORDER } from "@/components/StarLane";
import type { LaneImpact } from "@/lib/layout-engine";

function makeImpact(
  id: string,
  type: LaneImpact["type"],
  label = `Label for ${id}`,
): LaneImpact {
  return { id, type, label, metrics: [] };
}

describe("groupImpactsByType", () => {
  it("returns an empty array when given no impacts", () => {
    expect(groupImpactsByType([])).toEqual([]);
  });

  it("returns a single group when all impacts share one type", () => {
    const impacts = [
      makeImpact("a", "security"),
      makeImpact("b", "security"),
      makeImpact("c", "security"),
    ];
    const groups = groupImpactsByType(impacts);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe("security");
    expect(groups[0].impacts.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("groups impacts by type, rendering one entry per unique type", () => {
    const impacts = [
      makeImpact("r1", "reliability"),
      makeImpact("s1", "security"),
      makeImpact("r2", "reliability"),
      makeImpact("s2", "security"),
    ];
    const groups = groupImpactsByType(impacts);
    // Should have exactly 2 groups (reliability and security)
    expect(groups).toHaveLength(2);

    const types = groups.map((g) => g.type);
    expect(types).toContain("reliability");
    expect(types).toContain("security");

    const relGroup = groups.find((g) => g.type === "reliability")!;
    expect(relGroup.impacts.map((i) => i.id)).toEqual(["r1", "r2"]);

    const secGroup = groups.find((g) => g.type === "security")!;
    expect(secGroup.impacts.map((i) => i.id)).toEqual(["s1", "s2"]);
  });

  it("returns groups in deterministic order: reliability → observability → scalability → security", () => {
    const impacts = [
      makeImpact("sec", "security"),
      makeImpact("sca", "scalability"),
      makeImpact("obs", "observability"),
      makeImpact("rel", "reliability"),
    ];
    const groups = groupImpactsByType(impacts);
    expect(groups.map((g) => g.type)).toEqual([
      "reliability",
      "observability",
      "scalability",
      "security",
    ]);
  });

  it("excludes types that have no impacts (no empty groups)", () => {
    const impacts = [
      makeImpact("o1", "observability"),
      makeImpact("s1", "scalability"),
    ];
    const groups = groupImpactsByType(impacts);
    expect(groups).toHaveLength(2);
    const types = groups.map((g) => g.type);
    expect(types).not.toContain("reliability");
    expect(types).not.toContain("security");
  });

  it("preserves within-group order from the original impact_ids ordering", () => {
    // Impacts interleaved by type — within-group order must match original sequence
    const impacts = [
      makeImpact("r-first", "reliability"),
      makeImpact("s-first", "security"),
      makeImpact("r-second", "reliability"),
      makeImpact("s-second", "security"),
      makeImpact("r-third", "reliability"),
    ];
    const groups = groupImpactsByType(impacts);

    const relGroup = groups.find((g) => g.type === "reliability")!;
    expect(relGroup.impacts.map((i) => i.id)).toEqual([
      "r-first",
      "r-second",
      "r-third",
    ]);

    const secGroup = groups.find((g) => g.type === "security")!;
    expect(secGroup.impacts.map((i) => i.id)).toEqual(["s-first", "s-second"]);
  });

  it("handles all four types present and returns them in canonical order", () => {
    const impacts = [
      makeImpact("sc1", "scalability"),
      makeImpact("sec1", "security"),
      makeImpact("ob1", "observability"),
      makeImpact("rel1", "reliability"),
      makeImpact("rel2", "reliability"),
      makeImpact("sc2", "scalability"),
    ];
    const groups = groupImpactsByType(impacts);
    expect(groups.map((g) => g.type)).toEqual(IMPACT_TYPE_ORDER.slice());
    expect(groups[0].impacts.map((i) => i.id)).toEqual(["rel1", "rel2"]);
    expect(groups[1].impacts.map((i) => i.id)).toEqual(["ob1"]);
    expect(groups[2].impacts.map((i) => i.id)).toEqual(["sc1", "sc2"]);
    expect(groups[3].impacts.map((i) => i.id)).toEqual(["sec1"]);
  });

  it("is idempotent — same input always produces same output", () => {
    const impacts = [
      makeImpact("a", "reliability"),
      makeImpact("b", "security"),
      makeImpact("c", "reliability"),
    ];
    const result1 = groupImpactsByType(impacts);
    const result2 = groupImpactsByType(impacts);
    expect(result1).toEqual(result2);
  });
});
