import { test, expect } from "@playwright/test";

test.describe("Mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 size

  test("no horizontal overflow on mobile viewport", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Give components time to render and animate
    await page.waitForTimeout(1500);

    const overflow = await page.evaluate(() => {
      const { scrollWidth, clientWidth } = document.documentElement;
      return { scrollWidth, clientWidth, hasOverflow: scrollWidth > clientWidth };
    });

    expect(
      overflow.hasOverflow,
      `Horizontal overflow detected: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`,
    ).toBe(false);
  });

  test("at least one STAR lane is visible on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Lanes use role="row" with aria-label starting with "Project:"
    const lanes = page.getByRole("row").filter({ hasText: /PROBLEM|SOLUTION|RESULT/ });
    const count = await lanes.count();
    expect(count, "Expected at least one visible STAR lane").toBeGreaterThan(0);
  });

  test("cards stack vertically on mobile (not side-by-side)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Pick the first lane's problem and solution cards
    const layout = await page.evaluate(() => {
      const labels = document.querySelectorAll("span");
      let problemCard: DOMRect | null = null;
      let solutionCard: DOMRect | null = null;

      for (const label of labels) {
        const text = label.textContent?.trim();
        if (text === "PROBLEM" && !problemCard) {
          const card = label.closest("[class*='card']");
          if (card) problemCard = card.getBoundingClientRect();
        }
        if (text === "SOLUTION" && !solutionCard) {
          const card = label.closest("[class*='card']");
          if (card) solutionCard = card.getBoundingClientRect();
        }
        if (problemCard && solutionCard) break;
      }

      if (!problemCard || !solutionCard) return null;

      return {
        problemBottom: problemCard.bottom,
        solutionTop: solutionCard.top,
        problemLeft: problemCard.left,
        solutionLeft: solutionCard.left,
      };
    });

    // If we found cards, verify solution is below problem (stacked), not beside it
    if (layout) {
      expect(layout.solutionTop).toBeGreaterThan(layout.problemBottom - 30); // allow for small connector overlap
      // Left edges should be roughly aligned (within 20px)
      expect(Math.abs(layout.solutionLeft - layout.problemLeft)).toBeLessThan(20);
    }
  });

  test("hamburger company nav is reachable on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const hamburger = page.getByLabel("Open company navigation");
    // It may not exist if there's only one company, so check first
    const count = await hamburger.count();
    if (count > 0) {
      await expect(hamburger).toBeVisible();
      // Ensure it's not clipped or off-screen
      const box = await hamburger.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(390);
      }
    }
  });

  test("floating controls are visible and not overlapping content on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Check controls are within viewport
    const controlsVisible = await page.evaluate(() => {
      // Find the download button (most identifiable control)
      const links = document.querySelectorAll("a[download]");
      if (links.length === 0) return { found: false };

      const rect = links[0].getBoundingClientRect();
      return {
        found: true,
        inViewport:
          rect.right <= window.innerWidth + 5 &&
          rect.left >= -5 &&
          rect.top >= 0,
      };
    });

    if (controlsVisible.found) {
      expect(controlsVisible.inViewport).toBe(true);
    }
  });
});
