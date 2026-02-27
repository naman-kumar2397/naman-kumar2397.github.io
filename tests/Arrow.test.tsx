import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Arrow } from "@/components/StarLane";

describe("Arrow component", () => {
  it("renders with correct semantic colors for problem-solution variant", () => {
    const { container } = render(<Arrow active={false} variant="problem-solution" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // Check arrow head polygon has green fill (signal-2)
    const polygon = svg?.querySelector("polygon");
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute("fill")).toContain("110, 231, 183");
  });

  it("renders with correct semantic colors for solution-result variant", () => {
    const { container } = render(<Arrow active={false} variant="solution-result" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // Check arrow head polygon has blue fill
    const polygon = svg?.querySelector("polygon");
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute("fill")).toContain("126, 184, 255");
  });

  it("renders the same output on multiple renders (deterministic)", () => {
    const { container: c1 } = render(<Arrow active={false} variant="problem-solution" />);
    const { container: c2 } = render(<Arrow active={true} variant="problem-solution" />);

    const line1 = c1.querySelector("line");
    const line2 = c2.querySelector("line");

    expect(line1?.getAttribute("stroke")).toBe(line2?.getAttribute("stroke"));

    const polygon1 = c1.querySelector("polygon");
    const polygon2 = c2.querySelector("polygon");

    expect(polygon1?.getAttribute("fill")).toBe(polygon2?.getAttribute("fill"));
  });

  it("applies reduced opacity when not active", () => {
    const { container } = render(<Arrow active={false} variant="problem-solution" />);
    const svg = container.querySelector("svg");
    expect(svg?.style.opacity).toBe("0.6");
  });

  it("applies full opacity when active", () => {
    const { container } = render(<Arrow active={true} variant="problem-solution" />);
    const svg = container.querySelector("svg");
    expect(svg?.style.opacity).toBe("1");
  });
});
