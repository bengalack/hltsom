import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const css = () => readFileSync(new URL('../../assets/css/style.css', import.meta.url), 'utf8');

test('parallax is implemented with CSS scroll-driven animations, not JS', () => {
  expect(css()).toContain('animation-timeline: view()');
  const js = readFileSync(new URL('../../assets/js/main.js', import.meta.url), 'utf8');
  expect(js).not.toContain("addEventListener('scroll'");
});

test('parallax is guarded behind @supports', () => {
  expect(css()).toContain('@supports (animation-timeline: view())');
});

test('reduced motion disables smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
});

test('reduced motion removes block animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const name = await page.locator('#tjenester').evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('none');
});

test('parallax actually displaces the outgoing block', async ({ page }, testInfo) => {
  // Guards against the animation being syntactically present but a silent
  // no-op — an invalid animation-range would still satisfy the text checks.
  test.skip(testInfo.project.name !== 'desktop', 'parallax is desktop-only');
  await page.goto('/');

  const transformAt = async (y) => {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
    return page.locator('#tjenester').evaluate((el) => getComputedStyle(el).transform);
  };

  const atRest = await transformAt(0);
  const whileExiting = await transformAt(2200);
  expect(whileExiting).not.toBe(atRest);
  expect(whileExiting).toMatch(/^matrix/);
});

test('the page still scrolls to every block', async ({ page }) => {
  await page.goto('/');
  for (const id of ['#tjenester', '#kontakt', '#om']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await expect(page.locator(id)).toBeInViewport();
  }
});
