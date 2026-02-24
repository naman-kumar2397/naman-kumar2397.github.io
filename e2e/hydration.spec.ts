import { test, expect } from "@playwright/test";

test.describe("Hydration safety", () => {
  test("no hydration mismatch warnings on home page", async ({ page }) => {
    const errors: string[] = [];

    // Listen for console messages that indicate hydration issues
    page.on("console", (msg) => {
      const text = msg.text();
      const lowerText = text.toLowerCase();

      // Catch various hydration error patterns
      if (
        lowerText.includes("hydration") ||
        lowerText.includes("a tree hydrated but") ||
        lowerText.includes("did not match") ||
        lowerText.includes("text content does not match") ||
        lowerText.includes("server rendered") ||
        lowerText.includes("mismatch")
      ) {
        errors.push(text);
      }
    });

    // Navigate to home page
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Give React time to hydrate and report any errors
    await page.waitForTimeout(2000);

    // Assert no hydration errors were captured
    expect(errors, `Hydration errors found: ${errors.join("\n")}`).toHaveLength(0);
  });

  test("Arrow SVG gradient IDs are stable after hydration", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find all Arrow SVGs and verify their gradient references are valid
    const gradientMismatches = await page.evaluate(() => {
      const mismatches: string[] = [];
      const svgs = document.querySelectorAll("svg[aria-hidden='true']");

      svgs.forEach((svg, idx) => {
        const gradient = svg.querySelector("linearGradient");
        const line = svg.querySelector("line");

        if (gradient && line) {
          const gradientId = gradient.getAttribute("id");
          const stroke = line.getAttribute("stroke");

          if (stroke && gradientId) {
            const expectedStroke = `url(#${gradientId})`;
            if (stroke !== expectedStroke) {
              mismatches.push(
                `SVG ${idx}: gradient id="${gradientId}" but stroke="${stroke}"`
              );
            }
          }
        }
      });

      return mismatches;
    });

    expect(
      gradientMismatches,
      `Gradient ID mismatches found: ${gradientMismatches.join("\n")}`
    ).toHaveLength(0);
  });
});
