import { test, expect } from '@playwright/test';

test('PWA preserva outros produtos e nunca armazena URLs pessoais da montagem', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const other = await caches.open('riot-legacy-offline-sentinel');
    await other.put('/foreign-app', new Response('preserved'));
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await page.goto('/?build=regression-private-token');
  await page.evaluate(() => fetch('./version.json?token=regression-private-token', { cache: 'no-store' }));

  const found = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = [];
    for (const name of names) {
      const cache = await caches.open(name);
      urls.push(...(await cache.keys()).map(request => request.url));
    }
    const foreign = await caches.open('riot-legacy-offline-sentinel');
    return { names, urls, retained: await (await foreign.match('/foreign-app'))?.text() };
  });

  expect(found.names).toContain('montapc-v3');
  expect(found.retained).toBe('preserved');
  expect(found.urls.some(url => url.includes('regression-private-token'))).toBe(false);
  expect(found.urls.some(url => url.includes('version.json?'))).toBe(false);
});

test('upgrade do service worker apaga apenas caches antigos MontaPC', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const previous = await navigator.serviceWorker.getRegistration();
    if (previous) await previous.unregister();
    await caches.open('montapc-v1');
    await caches.open('chibi-gg-offline-sentinel');
    await navigator.serviceWorker.register('./sw.js?qa=upgrade', { scope: './' });
    await navigator.serviceWorker.ready;
  });

  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain('montapc-v1');
  const names = await page.evaluate(() => caches.keys());
  expect(names).toContain('montapc-v3');
  expect(names).toContain('chibi-gg-offline-sentinel');
});

test('shell e catálogo continuam disponíveis offline depois da instalação', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  try {
    const cached = await page.evaluate(async () => {
      const [shell, catalog] = await Promise.all([fetch('./index.html'), fetch('./catalog.snapshot.json')]);
      return {
        shellOk: shell.ok,
        shellText: await shell.text(),
        catalogOk: catalog.ok,
        catalog: await catalog.json()
      };
    });
    expect(cached.shellOk).toBe(true);
    expect(cached.shellText).toContain('id="planner-form"');
    expect(cached.catalogOk).toBe(true);
    expect(JSON.stringify(cached.catalog).length).toBeGreaterThan(1000);
  } finally {
    await context.setOffline(false);
  }
});
