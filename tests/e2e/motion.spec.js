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

/* Measure the effective scroll speed of a block while it is leaving the top of
   the viewport: how far it moves on screen per pixel scrolled.
     -1.0 = normal scroll speed (no parallax)
     -0.5 = half speed (the brief)
      0.0 = pinned
   Smooth scrolling must be disabled first: window.scrollTo() animates, so every
   sample would otherwise be taken mid-flight. That mistake made an earlier
   version of this test pass against a completely broken implementation. */
async function exitSpeed(page, selector) {
  return page.evaluate(async (sel) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const el = document.querySelector(sel);
    const samples = [];
    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += 40) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
      samples.push({
        y: window.scrollY,
        top: el.getBoundingClientRect().top,
        ty: m ? Number(m[1].split(',')[5]) : 0,
      });
    }
    window.scrollTo(0, 0);

    // the active phase is where the transform is actually changing
    let first = null, last = null;
    for (let i = 1; i < samples.length; i++) {
      if (Math.abs(samples[i].ty - samples[i - 1].ty) > 0.4) {
        if (!first) first = samples[i - 1];
        last = samples[i];
      }
    }
    if (!first || !last || last.y === first.y) return null;
    return (last.top - first.top) / (last.y - first.y);
  }, selector);
}

test('an outgoing block travels at roughly half scroll speed', async ({ page }, testInfo) => {
  // The actual brief: "blocks going out of screen will scroll half speed".
  // A negative translateY makes a block move FASTER than the page, not slower —
  // that was the original bug, and it measured -1.17 while looking plausible.
  test.skip(testInfo.project.name !== 'desktop', 'parallax is desktop-only');
  await page.goto('/');

  const speed = await exitSpeed(page, '#tjenester');
  expect(speed, 'parallax never displaces the block at all').not.toBeNull();
  expect(speed, `expected about -0.5 (half speed), measured ${speed}`).toBeLessThan(-0.30);
  expect(speed, `expected about -0.5 (half speed), measured ${speed}`).toBeGreaterThan(-0.70);
});

test('the parallax slows blocks down rather than speeding them up', async ({ page }, testInfo) => {
  // Guards the sign specifically: anything at or below -1.0 is a speed-up.
  test.skip(testInfo.project.name !== 'desktop', 'parallax is desktop-only');
  await page.goto('/');
  const speed = await exitSpeed(page, '#om');
  expect(speed, 'block moves faster than the page — translateY sign is inverted').toBeGreaterThan(-1.0);
});

test('the page still scrolls to every block', async ({ page }) => {
  await page.goto('/');
  for (const id of ['#tjenester', '#kontakt', '#om']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await expect(page.locator(id)).toBeInViewport();
  }
});
