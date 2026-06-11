/* Captures a PNG thumbnail of each guideline route by visiting the running
   dev server with headless Chromium. Output: public/thumbnails/<slug>.png

   Usage:
     1. In one terminal:  npm run dev   (must be up on http://localhost:5173)
     2. In another:       npm run thumbnails
*/

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/thumbnails');

const BASE = process.env.BASE_URL || 'http://localhost:5173';

// Keep in sync with the `routes` array in src/App.tsx.
const ROUTES = [
  'creative1',
  'creative2',
  'creative3',
  'creative4',
  'creative5',
  'creative6',
  'creative7',
  'creative8',
  'creative9',
  'expert1',
  'expert2',
  'expert3',
  'expert4',
  'expert5',
  'expert6',
  'pro1',
  'pro2',
  'pro3',
  'pro4',
  'pro5',
  'pro6',
  'pro7',
];

const VIEWPORT = { width: 1440, height: 900 };
// Slight settle delay for transitions/three.js scenes.
const SETTLE_MS = 1200;

async function ensureServerUp() {
  try {
    const res = await fetch(BASE, { method: 'HEAD' });
    if (!res.ok && res.status !== 304) {
      throw new Error(`Status ${res.status}`);
    }
  } catch (err) {
    console.error(
      `\nDev server not reachable at ${BASE}. Start it with \`npm run dev\` first.\n`,
    );
    throw err;
  }
}

async function main() {
  await ensureServerUp();

  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });

  console.log(`Capturing ${ROUTES.length} thumbnails to ${OUT_DIR}\n`);

  /* Hide the top-right info-overlay (dot + expanded card) so it
     doesn't appear in the captured thumbnails. */
  await context.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent =
      'button[aria-label="Show guideline info"], button[aria-label="Hide guideline info"] { display: none !important; }';
    document.documentElement.appendChild(style);
  });

  for (const slug of ROUTES) {
    const page = await context.newPage();
    const url = `${BASE}/${slug}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(SETTLE_MS);
      const buf = await page.screenshot({ type: 'png', fullPage: false });
      const outPath = resolve(OUT_DIR, `${slug}.png`);
      await writeFile(outPath, buf);
      console.log(`  ✓ ${slug.padEnd(10)} -> ${outPath.replace(ROOT + '/', '')}`);
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
