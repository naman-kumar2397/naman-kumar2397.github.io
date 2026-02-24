import "@testing-library/jest-dom/vitest";

// Mock CSS modules
const handler = {
  get: function (_target: Record<string, string>, prop: string) {
    return prop;
  },
};

vi.mock("@/components/StarLane.module.css", () => {
  return { default: new Proxy({}, handler) };
});
