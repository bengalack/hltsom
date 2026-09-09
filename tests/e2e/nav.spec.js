import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('the logo image actually loads and is not drawn in currentColor', async ({ page }) => {
  // The logo is loaded through an <img>, which cannot inherit color from the
  // page. currentColor resolves to black there and then vanishes entirely under
  // the nav's mix-blend-mode: difference — an invisible logo that no layout
  // assertion would catch.
  const svg = readFileSync(new URL('../../assets/img/logo.svg', import.meta.url), 'utf8');
  const withoutComments = svg.replace(/<!--[\s\S]*?-->/g, '');
  expect(withoutComments).not.toMatch(/(?:fill|stroke|color)\s*=\s*"currentColor"/);

  await page.goto('/');
  const painted = await page.locator('.site-nav__logo img').evaluate(
    (img) => img.complete && img.naturalWidth > 0
  );
  expect(painted).toBe(true);
});

test('logo and burger are fixed and always visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-nav')).toHaveCSS('position', 'fixed');
  await page.locator('#om').scrollIntoViewIfNeeded();
  await expect(page.locator('.site-nav__burger')).toBeVisible();
});

test('burger opens an overlay with four block links', async ({ page }) => {
  await page.goto('/');
  const burger = page.locator('.site-nav__burger');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  const links = page.locator('#meny a');
  await expect(links).toHaveCount(4);
  await expect(links.nth(0)).toHaveAttribute('href', '#splash');
  await expect(links.nth(1)).toHaveAttribute('href', '#tjenester');
  await expect(links.nth(2)).toHaveAttribute('href', '#kontakt');
  await expect(links.nth(3)).toHaveAttribute('href', '#om');
});

test('Escape closes the overlay and returns focus to the burger', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav__burger').click();
  await expect(page.locator('#meny')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#meny')).toBeHidden();
  await expect(page.locator('.site-nav__burger')).toBeFocused();
});

test('clicking a link closes the overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav__burger').click();
  await page.locator('#meny a[href="#kontakt"]').click();
  await expect(page.locator('#meny')).toBeHidden();
});

test('the burger itself closes the open overlay', async ({ page }) => {
  // Regression guard: if .site-nav sinks below .nav-overlay in the stacking
  // order, the burger is covered and this click silently hits the overlay.
  await page.goto('/');
  const burger = page.locator('.site-nav__burger');
  await burger.click();
  await expect(page.locator('#meny')).toBeVisible();
  await burger.click();
  await expect(page.locator('#meny')).toBeHidden();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

test('focus is trapped inside the open overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav__burger').click();
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() =>
    document.getElementById('meny').contains(document.activeElement)
  );
  expect(inside).toBe(true);
});
