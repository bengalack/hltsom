import { test, expect } from '@playwright/test';

test('has canonical, description and Open Graph tags', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /hltsom/);
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc.length).toBeGreaterThan(70);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'nb_NO');
});

test('LocalBusiness structured data is valid JSON with the required fields', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').innerText();
  const data = JSON.parse(raw);
  expect(data['@type']).toBe('LocalBusiness');
  expect(data.name).toBe('HLT Søm');
  expect(data.telephone).toBeTruthy();
  expect(data.address['@type']).toBe('PostalAddress');
  expect(data.address.addressCountry).toBe('NO');
  expect(data.areaServed.length).toBeGreaterThan(0);
});

test('has a Content-Security-Policy meta tag restricting sources', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain('frame-src https://www.google.com');
  expect(csp).not.toContain("'unsafe-eval'");
});

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<urlset');
});

test('heading order is sane: one h1, then h2s', async ({ page }) => {
  await page.goto('/');
  const levels = await page.locator('h1, h2, h3').evaluateAll((els) =>
    els.map((e) => Number(e.tagName[1]))
  );
  expect(levels[0]).toBe(1);
  expect(levels.filter((l) => l === 1)).toHaveLength(1);
});
