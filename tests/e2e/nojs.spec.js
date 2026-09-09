import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('page is fully readable without JavaScript', async ({ page }) => {
  // The failure mode this guards: a visitor gets a blank screen and calls nobody.
  await page.goto('/');
  await expect(page.locator('.splash__mark')).toBeVisible();
  await expect(page.locator('#tjenester')).toContainText('Legging av bukser');
  await expect(page.locator('#kontakt a[href^="tel:"]')).toBeVisible();
  await expect(page.locator('.site-footer')).toContainText('Telefon');
});

test('first carousel image still shows without JavaScript', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.splash__slide').first();
  await expect(first).toHaveClass(/is-active/);
  const bg = await first.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toMatch(/url\(/);
});
