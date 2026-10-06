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

async function assertUi(condition, message) {
  if (!condition) throw new Error('Smoke test: ' + message);
}

async function runSmokeChecks(page, profileName) {
  let compareFile = null;
  let componentFile = null;
  const catalogCount = Number((await page.locator('#catalog-count').textContent())?.trim() || 0);
  await assertUi(catalogCount > 0, 'catálogo não carregou');

  const generateButton = page.locator('#generate-build');
  await assertUi(await generateButton.isEnabled(), 'botão de geração está desabilitado');

  if (!(await page.locator('#build-result').isVisible())) {
    await generateButton.click();
    await page.locator('#build-result').waitFor({ state: 'visible', timeout: 15_000 });
  }

  const partsToggle = page.locator('#parts-toggle');
  if (await partsToggle.count()) {
    const partsHidden = await page.locator('#parts-list').evaluate(element => element.hidden);
    if (partsHidden) {
      await partsToggle.click();
      await page.waitForTimeout(120);
    }
  }

  await assertUi((await page.locator('#parts-list .part-row').count()) >= 7, 'lista de peças incompleta');

  const languageSelect = page.locator('#language-select');
  await languageSelect.selectOption('en');
  await page.waitForTimeout(150);
  await assertUi((await page.locator('#result-empty').isHidden()), 'build sumiu ao trocar idioma');
  await assertUi((await page.locator('#build-title').textContent())?.includes('Recommended'), 'tradução EN dinâmica não aplicada');

  await languageSelect.selectOption('pt-BR');
  await page.waitForTimeout(150);

  const motherboard = page.locator('select[data-part="motherboard"]');
  const originalBoard = await motherboard.inputValue();
  const boardOptions = await motherboard.locator('option').evaluateAll(options =>
    options.map(option => ({ value: option.value, text: option.textContent || '' }))
  );
  const incompatible = boardOptions.find(option => /B650M|AM5/i.test(option.text) && option.value !== originalBoard);

  if (incompatible) {
    await motherboard.selectOption(incompatible.value);
    await page.waitForTimeout(150);
    await assertUi(await page.locator('#save-build').isDisabled(), 'build incompatível ainda pode ser salva');
    await motherboard.selectOption(originalBoard);
    await page.waitForTimeout(150);
    await assertUi(await page.locator('#save-build').isEnabled(), 'build compatível não voltou ao estado salvável');
  }

  await page.locator('#save-build').click();
  await page.locator('#name-dialog').waitFor({ state: 'visible', timeout: 5000 });
  const smokeName = 'QA Snapshot ' + Date.now();
  await page.locator('#name-form input[name="name"]').fill(smokeName);
  await page.locator('#name-form').evaluate(form => form.requestSubmit());
  await page.locator('#name-dialog').waitFor({ state: 'hidden', timeout: 5000 });
  await assertUi((await page.locator('#saved-builds').textContent())?.includes(smokeName), 'salvamento local falhou');

  const firstMoreActions = page.locator('#saved-builds .saved-more').first();
  if (await firstMoreActions.count()) {
    await firstMoreActions.evaluate(element => { element.open = true; });
    await page.waitForTimeout(80);
  }

  const duplicateButton = page.locator('#saved-builds [data-duplicate]').first();
  await duplicateButton.click();
  await page.waitForTimeout(150);
  await assertUi((await page.locator('#saved-builds .saved-card').count()) >= 2, 'duplicação de build falhou');

  const copyOpen = page.locator('#saved-builds [data-open]').first();
  await copyOpen.click();
  await page.waitForTimeout(120);

  const copyPartsToggle = page.locator('#parts-toggle');
  if (await copyPartsToggle.count()) {
    const copyPartsHidden = await page.locator('#parts-list').evaluate(element => element.hidden);
    if (copyPartsHidden) {
      await copyPartsToggle.click();
      await page.waitForTimeout(80);
    }
  }

  const gpuSelect = page.locator('select[data-part="gpu"]');
  const currentGpu = await gpuSelect.inputValue();
  const gpuValues = await gpuSelect.locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
  const alternativeGpu = gpuValues.find(value => value !== currentGpu);

  if (alternativeGpu) {
    await gpuSelect.selectOption(alternativeGpu);
    await page.waitForTimeout(120);
    if (await page.locator('#save-build').isEnabled()) {
      await page.locator('#save-build').click();
      await page.locator('#name-dialog').waitFor({ state: 'visible', timeout: 5000 });
      await page.locator('#name-form input[name="name"]').fill(smokeName + ' alternativa');
      await page.locator('#name-form').evaluate(form => form.requestSubmit());
      await page.locator('#name-dialog').waitFor({ state: 'hidden', timeout: 5000 });
    }
  }

  const compareButtons = page.locator('#saved-builds [data-compare]');
  await compareButtons.nth(0).click();
  await compareButtons.nth(1).click();
  await page.waitForTimeout(150);
  await assertUi(await page.locator('#compare-panel').isVisible(), 'painel de comparação não abriu');
  await assertUi((await page.locator('#compare-content .compare-grid').count()) >= 2, 'comparação não foi renderizada');

  compareFile = `latest-${profileName}-compare.png`;
  await page.screenshot({
    path: path.join(outputDir, compareFile),
    fullPage: true,
    animations: 'disabled'
  });

  const catalogDetails = page.locator('.catalog-explorer');
  if (await catalogDetails.count()) {
    await catalogDetails.evaluate(element => { element.open = true; });
    await page.waitForTimeout(120);

    const initialCatalogCards = await page.locator('#catalog-grid .catalog-card').count();
    const expectedMax = page.viewportSize()?.width && page.viewportSize().width <= 650 ? 6 : 12;
    await assertUi(initialCatalogCards > 0 && initialCatalogCards <= expectedMax, 'catálogo inicial não está paginado');

    const moreButton = page.locator('#catalog-load-more');
    if (await moreButton.isVisible().catch(() => false)) {
      await moreButton.click();
      await page.waitForTimeout(120);
      const expandedCatalogCards = await page.locator('#catalog-grid .catalog-card').count();
      await assertUi(expandedCatalogCards > initialCatalogCards, 'carregamento progressivo do catálogo falhou');
    }

    const firstDetails = page.locator('#catalog-grid [data-component-details]').first();
    if (await firstDetails.count()) {
      await firstDetails.click();
      await page.locator('#component-dialog').waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(150);
      componentFile = `latest-${profileName}-component.png`;
      await page.screenshot({
        path: path.join(outputDir, componentFile),
        fullPage: false,
        animations: 'disabled'
      });
      await page.locator('#component-dialog-close').click();
      await page.waitForTimeout(80);
    }

    await catalogDetails.evaluate(element => { element.open = false; });
  }

  while (await page.locator('#saved-builds .saved-card').count()) {
    const moreActions = page.locator('#saved-builds .saved-more').first();
    if (await moreActions.count()) {
      await moreActions.evaluate(element => { element.open = true; });
      await page.waitForTimeout(60);
    }

    const savedDelete = page.locator('#saved-builds [data-delete]').first();
    page.once('dialog', dialog => dialog.accept());
    await savedDelete.click();
    await page.waitForTimeout(100);
  }

  return { compareFile, componentFile };
}

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
      await page.waitForTimeout(2300);
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
      await languageSelect.selectOption('pt-BR');
      await page.waitForTimeout(250);
    }

    let catalogFile = null;
    const catalogDetails = page.locator('.catalog-explorer');
    if (await catalogDetails.count()) {
      await catalogDetails.evaluate(element => { element.open = true; });
      await page.waitForTimeout(250);
      catalogFile = `latest-${profile.name}-catalog.png`;
      await page.screenshot({
        path: path.join(outputDir, catalogFile),
        fullPage: true,
        animations: 'disabled'
      });
      await catalogDetails.evaluate(element => { element.open = false; });
    }

    const smokeFiles = await runSmokeChecks(page, profile.name);

    results.push({
      profile: profile.name,
      emptyFile: emptyFilename,
      buildFile: buildFilename,
      englishBuildFile,
      catalogFile,
      compareFile: smokeFiles.compareFile,
      componentFile: smokeFiles.componentFile,
      viewport: profile.viewport,
      title: await page.title(),
      smokeTest: 'passed'
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
