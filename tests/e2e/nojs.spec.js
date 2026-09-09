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
  // Slides 2-4 are filled in by script, so without JS the splash is a single
  // still image. That is the intended degradation, not a fault.
  await page.goto('/');
  const first = page.locator('.splash__slide').first();
  await expect(first).toHaveClass(/is-active/);
  const painted = await first.evaluate((el) => el.complete && el.naturalWidth > 0);
  expect(painted).toBe(true);
});

test('the map still works without JavaScript', async ({ page }) => {
  // The map is plain markup now, so it no longer depends on script at all.
  await page.goto('/');
  await expect(page.locator('#kontakt iframe')).toHaveCount(1);
});
