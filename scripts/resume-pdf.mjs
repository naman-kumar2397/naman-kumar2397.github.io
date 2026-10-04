// Builds the site, serves it, and prints /resume to public/resume.pdf.
// Usage: npm run resume:pdf   (set CHROMIUM_PATH if Chromium is not auto-detected)
import { build, preview } from 'astro';
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

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
} finally {
  await browser.close();
  await server.stop();
}
