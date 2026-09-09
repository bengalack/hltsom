import { test, expect } from '@playwright/test';

test('carousel advances to the second slide', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.splash__slide').first()).toHaveClass(/is-active/);
  await expect(page.locator('.splash__slide').nth(1)).toHaveClass(/is-active/, { timeout: 9000 });
});

test('carousel does not advance under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(7000);
  await expect(page.locator('.splash__slide').first()).toHaveClass(/is-active/);
  await expect(page.locator('.splash__slide').nth(1)).not.toHaveClass(/is-active/);
});
