import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const targetUrl = process.env.SCREENSHOT_URL || 'https://helioconde.github.io/montapc/';
const outputDir = process.env.SCREENSHOT_DIR || 'screenshots';
const commitSha = process.env.GITHUB_SHA || 'local';
const generatedAt = new Date().toISOString();

const profiles = [
  {
    name: 'desktop',
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1
  },
  {
    name: 'mobile',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1
  }
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor,
      locale: 'pt-BR'
    });

    const page = await context.newPage();

    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });

    if (!response?.ok()) {
      throw new Error(`Falha ao abrir ${targetUrl}: HTTP ${response?.status() ?? 'sem resposta'}`);
    }

    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const filename = `latest-${profile.name}.png`;
    const outputPath = path.join(outputDir, filename);

    await page.screenshot({
      path: outputPath,
      fullPage: true,
      animations: 'disabled'
    });

    results.push({
      profile: profile.name,
      file: filename,
      viewport: profile.viewport,
      title: await page.title()
    });

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(outputDir, 'metadata.json'),
  JSON.stringify({
    url: targetUrl,
    generatedAt,
    commitSha,
    captures: results
  }, null, 2) + '\n',
  'utf8'
);

console.log(`Snapshots salvos em ${outputDir}/`);
