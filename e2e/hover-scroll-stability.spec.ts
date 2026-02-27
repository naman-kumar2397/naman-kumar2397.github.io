import { test, expect } from "@playwright/test";

test.describe("Lane scroll stability (click-only expansion)", () => {
  const LANE_SELECTOR = '[data-testid="lane-cvent-prj-observability"]';

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(LANE_SELECTOR, { state: "visible", timeout: 15_000 });
  });

  test("hovering a lane does NOT expand it or cause scroll", async ({ page }) => {
    const lane = page.locator(LANE_SELECTOR);

    await lane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Hover the lane
    await lane.hover();
    await page.waitForTimeout(800);

    const scrollAfter = await page.evaluate(() => window.scrollY);

    // Scroll should not have changed
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(1);

    // Lane should NOT be expanded (hover no longer expands)
    const expanded = await lane.getAttribute("aria-expanded");
    expect(expanded).toBe("false");
  });

  test("clicking a lane expands it", async ({ page }) => {
    const lane = page.locator(LANE_SELECTOR);

    await lane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await lane.click();
    await page.waitForTimeout(500);

    const expanded = await lane.getAttribute("aria-expanded");
    expect(expanded).toBe("true");
  });

  test("moving mouse within lane does not scroll-loop", async ({ page }) => {
    const lane = page.locator(LANE_SELECTOR);

    await lane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Move mouse within the lane bounding box 3 times
    const box = await lane.boundingBox();
    expect(box).not.toBeNull();

    for (let i = 0; i < 3; i++) {
      await page.mouse.move(
        box!.x + box!.width * 0.3 + i * 10,
        box!.y + box!.height * 0.3 + i * 5,
      );
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(400);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(1);
  });
});
