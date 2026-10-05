// Builds the site, serves it, and renders the static assets that are committed:
//   /resume/ -> public/resume.pdf
//   /og/     -> public/og.png (1200x630 social card)
// Usage: npm run assets   (set CHROMIUM_PATH if Chromium is not auto-detected)
import { build, preview } from 'astro';
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';

const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));

await build({ logLevel: 'warn' });
const server = await preview({ server: { port: 4399 }, logLevel: 'warn' });
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:4399/resume/', { waitUntil: 'networkidle' });
  await page.pdf({ path: 'public/resume.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('wrote public/resume.pdf');

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto('http://localhost:4399/og/', { waitUntil: 'networkidle' });
  await og.screenshot({ path: 'public/og.png' });
  console.log('wrote public/og.png');

  // Per-case-study share cards (one per built /og/<id>/ page).
  mkdirSync('public/social', { recursive: true });
  for (const id of readdirSync('dist/og', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    await og.goto(`http://localhost:4399/og/${id}/`, { waitUntil: 'networkidle' });
    await og.screenshot({ path: `public/social/${id}.png` });
    console.log(`wrote public/social/${id}.png`);
  }
} finally {
  await browser.close();
  await server.stop();
}
