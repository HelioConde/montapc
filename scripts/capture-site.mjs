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

    const emptyFilename = `latest-${profile.name}.png`;
    const emptyOutputPath = path.join(outputDir, emptyFilename);

    await page.screenshot({
      path: emptyOutputPath,
      fullPage: true,
      animations: 'disabled'
    });

    const generateButton = page.locator('#generate-build');
    if (await generateButton.isEnabled().catch(() => false)) {
      await generateButton.click();
      await page.locator('#build-result').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(800);
    }

    const buildFilename = `latest-${profile.name}-build.png`;
    const buildOutputPath = path.join(outputDir, buildFilename);

    await page.screenshot({
      path: buildOutputPath,
      fullPage: true,
      animations: 'disabled'
    });

    const languageSelect = page.locator('#language-select');
    let englishBuildFile = null;
    if (await languageSelect.count()) {
      await languageSelect.selectOption('en');
      await page.waitForTimeout(400);
      englishBuildFile = `latest-${profile.name}-build-en.png`;
      await page.screenshot({
        path: path.join(outputDir, englishBuildFile),
        fullPage: true,
        animations: 'disabled'
      });
    }

    results.push({
      profile: profile.name,
      emptyFile: emptyFilename,
      buildFile: buildFilename,
      englishBuildFile,
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
