import { test, expect } from '@playwright/test';

test('footer is dark, centred, and holds org number, email and phone', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer).toHaveCSS('text-align', 'center');
  await expect(footer).toContainText('Organisasjonsnummer');
  await expect(footer).toContainText('E-post');
  await expect(footer).toContainText('Telefon');
  await expect(footer).toHaveCSS('background-color', 'rgb(20, 17, 15)');
});

test('footer contrasts with the block above it', async ({ page }) => {
  await page.goto('/');
  const above = await page.locator('#om').evaluate((el) => getComputedStyle(el).backgroundColor);
  const footer = await page.locator('.site-footer').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(above).not.toBe(footer);
});
