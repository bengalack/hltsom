import { test, expect } from '@playwright/test';

test('wordmark renders in Cormorant Infant italic', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveText('søm');
  const family = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('Cormorant Infant');
  await expect(h1).toHaveCSS('font-style', 'italic');
});

test('body text renders in Inter', async ({ page }) => {
  await page.goto('/');
  const family = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('Inter');
});

test('fonts are loaded from this origin, never from Google', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) external.push(u);
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
});

test('design tokens are defined on :root', async ({ page }) => {
  await page.goto('/');
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      ink: s.getPropertyValue('--ink').trim(),
      paper: s.getPropertyValue('--paper').trim(),
      interval: s.getPropertyValue('--carousel-interval').trim(),
    };
  });
  expect(tokens.ink).toBe('#14110f');
  expect(tokens.paper).toBe('#fdfcfa');
  expect(tokens.interval).toBe('5s');
});
