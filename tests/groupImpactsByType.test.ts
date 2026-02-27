import { describe, it, expect } from "vitest";
import { groupImpactsByType } from "@/lib/layout-engine";
import type { LaneImpact } from "@/lib/layout-engine";

const makeImpact = (
  id: string,
  type: LaneImpact["type"],
  label = id,
  metrics: string[] = [],
): LaneImpact => ({ id, type, label, metrics });

describe("groupImpactsByType", () => {
  it("returns an empty object for an empty array", () => {
    expect(groupImpactsByType([])).toEqual({});
  });

  it("groups a single impact correctly", () => {
    const impacts = [makeImpact("i1", "reliability", "99.9 % uptime")];
    expect(groupImpactsByType(impacts)).toEqual({
      reliability: [impacts[0]],
    });
  });

  it("groups multiple impacts of different types", () => {
    const impacts = [
      makeImpact("i1", "reliability"),
      makeImpact("i2", "scalability"),
      makeImpact("i3", "observability"),
      makeImpact("i4", "security"),
    ];
    const result = groupImpactsByType(impacts);
    expect(result.reliability).toHaveLength(1);
    expect(result.scalability).toHaveLength(1);
    expect(result.observability).toHaveLength(1);
    expect(result.security).toHaveLength(1);
  });

  it("groups multiple impacts of the same type together", () => {
    const impacts = [
      makeImpact("i1", "reliability", "uptime"),
      makeImpact("i2", "scalability", "throughput"),
      makeImpact("i3", "reliability", "latency"),
    ];
    const result = groupImpactsByType(impacts);
    expect(result.reliability).toHaveLength(2);
    expect(result.reliability.map((i) => i.id)).toEqual(["i1", "i3"]);
    expect(result.scalability).toHaveLength(1);
    expect(result.observability).toBeUndefined();
    expect(result.security).toBeUndefined();
  });

  it("preserves the original order of impacts within each group", () => {
    const impacts = [
      makeImpact("a", "security"),
      makeImpact("b", "security"),
      makeImpact("c", "security"),
    ];
    const result = groupImpactsByType(impacts);
    expect(result.security.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const impacts = [makeImpact("i1", "reliability")];
    const copy = [...impacts];
    groupImpactsByType(impacts);
    expect(impacts).toEqual(copy);
  });

  it("includes metrics on grouped impacts", () => {
    const impacts = [makeImpact("i1", "observability", "traces", ["p99 50ms", "alerts reduced 40%"])];
    const result = groupImpactsByType(impacts);
    expect(result.observability[0].metrics).toEqual(["p99 50ms", "alerts reduced 40%"]);
  });
});
