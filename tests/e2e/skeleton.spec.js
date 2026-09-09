import { test, expect } from '@playwright/test';

test('page loads with Norwegian language and a descriptive title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/HLT Søm/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
});

test('page has exactly one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('all four blocks are present in order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section').evaluateAll(
    (els) => els.map((e) => e.id)
  );
  expect(ids).toEqual(['splash', 'tjenester', 'kontakt', 'om']);
});
