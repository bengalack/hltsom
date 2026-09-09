import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('splash fills the viewport', async ({ page }) => {
  await page.goto('/');
  const box = await page.locator('#splash').boundingBox();
  const vh = page.viewportSize().height;
  expect(box.height).toBeGreaterThanOrEqual(vh - 2);
});

test('wordmark and tagline are present and centred', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.splash__mark')).toHaveText('søm');
  await expect(page.locator('.splash__tagline')).toHaveText('Godt håndverk, lokalt i Bærum');
  await expect(page.locator('.splash__tagline')).toHaveCSS('text-align', 'center');
});

test('splash has four slides and the first is active', async ({ page }) => {
  await page.goto('/');
  const slides = page.locator('.splash__slide');
  expect(await slides.count()).toBe(4);
  await expect(slides.first()).toHaveClass(/is-active/);
});

test('only the first slide is fetched with the page', async ({ page }) => {
  // Deferring slides 2-4 keeps ~900KB off the critical path. If someone gives
  // them all a plain src, this fails.
  const imageRequests = [];
  page.on('request', (r) => {
    if (/splash-\d\.webp/.test(r.url())) imageRequests.push(r.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(imageRequests.filter((u) => u.includes('splash-1.webp')).length).toBe(1);
  expect(imageRequests.some((u) => /splash-[234]\.webp/.test(u))).toBe(false);
});

test('slide backgrounds actually render, and the CSP blocks nothing', async ({ page }) => {
  // Regression guard. The slides once carried inline style="background-image:..."
  // attributes, which the page's own CSP silently blocked: the splash rendered
  // as a black rectangle while every other test still passed.
  const violations = [];
  page.on('console', (m) => {
    if (m.text().includes('Content Security Policy')) violations.push(m.text());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // The first slide must be painted immediately; the rest are filled in by
  // main.js after load, so wait for that before asserting on all of them.
  await page.waitForFunction(
    () => [...document.querySelectorAll('.splash__slide')].every((i) => i.getAttribute('src')),
    null, { timeout: 5000 }
  );
  const painted = await page.locator('.splash__slide').evaluateAll(
    (els) => els.map((el) => el.complete && el.naturalWidth > 0)
  );
  expect(painted.length).toBeGreaterThanOrEqual(4);
  expect(painted.every(Boolean)).toBe(true);

  expect(violations).toEqual([]);
});

test('index.html contains no inline style attributes', () => {
  // The CSP has no 'unsafe-inline', so any style attribute is dead on arrival.
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  expect(html).not.toMatch(/\sstyle="/);
});

test('splash height uses svh, not vh', () => {
  // iOS Safari's collapsing address bar makes 100vh wrong on exactly the
  // devices most visitors use.
  const css = readFileSync(new URL('../../assets/css/style.css', import.meta.url), 'utf8');
  expect(css).toContain('100svh');
  expect(css).not.toMatch(/height:\s*100vh/);
});
