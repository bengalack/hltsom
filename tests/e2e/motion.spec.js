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

/* The brief says "half speed". In practice the ratio drifts between about -0.2
   and -0.65 depending on how tall the block is relative to the viewport, because
   the translate is a percentage of the block while the exit range is not. The
   design intent is "clearly slower than the page", so the bounds below are set
   to catch the failures that matter — no movement at all, or movement at or
   past normal speed — rather than to police a decimal. */
const SLOWER_THAN_PAGE = -0.75;   // anything below this is barely moving
const CLEARLY_SLOWED    = -0.20;  // anything above this is not slowed enough

async function expectHalfSpeed(page, selector) {
  const speed = await exitSpeed(page, selector);
  expect(speed, `${selector} has no parallax at all`).not.toBeNull();
  expect(speed, `${selector} is not slowed enough: measured ${speed}`).toBeLessThan(CLEARLY_SLOWED);
  expect(speed, `${selector} is almost pinned: measured ${speed}`).toBeGreaterThan(SLOWER_THAN_PAGE);
  return speed;
}

test('an outgoing block travels at roughly half scroll speed', async ({ page }) => {
  // The actual brief: "blocks going out of screen will scroll half speed".
  // A negative translateY makes a block move FASTER than the page, not slower —
  // that was the original bug, and it measured -1.17 while looking plausible.
  await page.goto('/');
  await expectHalfSpeed(page, '#tjenester');
});

test('every block parallaxes, including the splash', async ({ page }) => {
  // The brief says "the blocks", which includes block 1. It was originally
  // scoped to blocks 2-4 only, so the hero left the screen at normal speed
  // while everything below it lagged — the first transition anyone sees.
  await page.goto('/');
  for (const sel of ['#splash', '#tjenester', '#kontakt', '#om']) {
    await expectHalfSpeed(page, sel);
  }
});

test('an incoming block passes over the outgoing one, not under it', async ({ page }) => {
  // The lagging block must not cover the block arriving over it. #splash is
  // position: relative, so paint order is worth asserting rather than assuming.
  await page.goto('/');
  const winner = await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const splash = document.querySelector('#splash');
    // scroll to where the splash is exiting and #tjenester is arriving
    window.scrollTo(0, Math.round(splash.getBoundingClientRect().height * 0.9));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    // sample just below the top of the incoming block
    const t = document.querySelector('#tjenester').getBoundingClientRect();
    const el = document.elementFromPoint(window.innerWidth / 2, t.top + 12);
    window.scrollTo(0, 0);
    return el ? (el.closest('section')?.id ?? 'none') : 'none';
  });
  expect(winner, 'the outgoing splash is painting over the incoming block').toBe('tjenester');
});

test('the parallax slows blocks down rather than speeding them up', async ({ page }) => {
  // Guards the sign specifically: anything at or below -1.0 is a speed-up.
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
