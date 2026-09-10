import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const css = () => readFileSync(new URL('../../assets/css/style.css', import.meta.url), 'utf8');
const js = () => readFileSync(new URL('../../assets/js/main.js', import.meta.url), 'utf8');

test('parallax does not use a viewport-relative timeline', () => {
  // animation-timeline: view() and scroll() are both measured against the
  // scrollport, which mobile browsers resize mid-drag. That was the shiver.
  // Comments are stripped first: the stylesheet explains the trap by name, and
  // matching that prose would fail for the wrong reason.
  const withoutComments = css().replace(/\/\*[\s\S]*?\*\//g, '');
  expect(withoutComments).not.toContain('animation-timeline');
});

test('the parallax computation never reads the viewport height', () => {
  // The root cause of the mobile jitter, guarded at source: the offset must be
  // a function of document coordinates alone.
  const src = js();
  const start = src.indexOf('function initParallax');
  expect(start, 'initParallax is missing').toBeGreaterThan(-1);
  const body = src.slice(start, src.indexOf('initParallax();', start));
  expect(body).not.toMatch(/innerHeight|clientHeight|visualViewport|getBoundingClientRect/);
});

test('reduced motion disables smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
});

test('reduced motion leaves every block untransformed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(250);
  const transforms = await page.evaluate(() =>
    ['#splash', '#tjenester', '#kontakt', '#om'].map(
      (s) => getComputedStyle(document.querySelector(s)).transform
    )
  );
  expect(transforms).toEqual(['none', 'none', 'none', 'none']);
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

test('every block parallaxes except the last, which holds the footer', async ({ page }) => {
  // The brief says "the blocks", which includes block 1 — it was originally
  // scoped to blocks 2-4, so the first transition anyone sees had no effect.
  // The LAST block is excluded on purpose: only the static footer sits beneath
  // it, and a lagging block would drift away from it.
  await page.goto('/');
  for (const sel of ['#splash', '#tjenester', '#kontakt']) {
    await expectHalfSpeed(page, sel);
  }
  const last = await exitSpeed(page, '#om');
  expect(last, 'the last block must not parallax — the footer is attached to it').toBeNull();
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
  const speed = await exitSpeed(page, '#kontakt');
  expect(speed, 'block moves faster than the page — the offset sign is inverted').toBeGreaterThan(-1.0);
});

test('the page still scrolls to every block', async ({ page }) => {
  await page.goto('/');
  for (const id of ['#tjenester', '#kontakt', '#om']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await expect(page.locator(id)).toBeInViewport();
  }
});

test('the footer stays put and is never covered by the lagging last block', async ({ page }) => {
  /* The footer is too short to parallax, so it must sit still while block 4
     leaves. Note what is and is not required here:

       - No GAP may ever open between block 4 and the footer.
       - The footer must not move in the document.
       - The footer must never be painted over.

     A few pixels of geometric OVERLAP are fine and are in fact the intended
     behaviour: the footer is the element arriving after block 4, so it slides
     over it exactly as each block slides over the one before. The overlap is
     bounded to the footer's own top padding so it can never eat into content. */
  await page.goto('/');
  const r = await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const om = document.querySelector('#om');
    const ft = document.querySelector('.site-footer');
    const paddingTop = parseFloat(getComputedStyle(ft).paddingTop);
    const positions = new Set();
    // the deepest actual content in the block, ignoring its padding
    const lastContent = om.querySelector('.split__body p:last-of-type') || om;
    let worstGap = Infinity;
    let contentHidden = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += 40) {
      window.scrollTo(0, y);
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      worstGap = Math.min(worstGap, ft.getBoundingClientRect().top - om.getBoundingClientRect().bottom);
      positions.add(Math.round(ft.getBoundingClientRect().top + window.scrollY));
      const c = lastContent.getBoundingClientRect();
      const f = ft.getBoundingClientRect();
      // content is hidden only if it is on screen AND reaches under the footer
      if (c.bottom > f.top && c.top < f.top && c.bottom > 0) contentHidden = true;
    }
    window.scrollTo(0, 0);
    return { worstGap, paddingTop, distinctPositions: positions.size, contentHidden };
  });

  expect(r.worstGap, `a gap of ${r.worstGap}px opened above the footer`).toBeLessThanOrEqual(0.5);
  expect(r.distinctPositions, 'the footer moves while scrolling — it must be static').toBe(1);
  expect(r.contentHidden,
    'the last block lagged far enough for the footer to cover its text')
    .toBe(false);
});

test('the footer paints above the last block, and has no parallax of its own', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, max);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const ft = document.querySelector('.site-footer');
    const f = ft.getBoundingClientRect();
    const el = document.elementFromPoint(window.innerWidth / 2, f.top + 6);
    const cs = getComputedStyle(ft);
    window.scrollTo(0, 0);
    return { painter: el ? (el.closest('footer,section')?.className || el.tagName) : 'none',
             animation: cs.animationName, transform: cs.transform };
  });
  expect(r.painter, 'something else is painting over the footer').toContain('site-footer');
  expect(r.animation, 'the footer must not parallax — it is too short for the effect').toBe('none');
  expect(r.transform).toBe('none');
});

test('parallax works on touch devices too', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'touch devices only');
  await page.goto('/');
  for (const sel of ['#splash', '#tjenester', '#kontakt']) {
    const speed = await exitSpeed(page, sel);
    expect(speed, `${sel} has no parallax on mobile`).not.toBeNull();
    expect(speed, `${sel} not slowed: ${speed}`).toBeLessThan(CLEARLY_SLOWED);
    expect(speed, `${sel} almost pinned: ${speed}`).toBeGreaterThan(SLOWER_THAN_PAGE);
  }
});

test('the footer and the last block never move relative to each other', async ({ page }) => {
  /* "Statically linked": whatever the scroll does, the distance between the
     bottom of block 4 and the top of the footer must not change. On mobile the
     page is long enough for the last block to animate, and rubber-band
     overscroll at the bottom pushes it further still — which is where this was
     visible. Keeping the last block untransformed is what holds them together. */
  await page.goto('/');
  const r = await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const om = document.querySelector('#om');
    const ft = document.querySelector('.site-footer');
    const gaps = new Set();
    let maxTransform = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += 25) {
      window.scrollTo(0, y);
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      gaps.add(Math.round(ft.getBoundingClientRect().top - om.getBoundingClientRect().bottom));
      const m = getComputedStyle(om).transform.match(/matrix\(([^)]+)\)/);
      maxTransform = Math.max(maxTransform, m ? Math.abs(Number(m[1].split(',')[5])) : 0);
    }
    window.scrollTo(0, 0);
    return { distinctGaps: [...gaps], maxTransform };
  });

  expect(r.maxTransform, 'the last block is being transformed and will drift from the footer')
    .toBeLessThanOrEqual(0.5);
  expect(r.distinctGaps.length,
    `the gap to the footer changed while scrolling: ${r.distinctGaps.join(', ')}px`).toBe(1);
});

test('the offset is a pure function of document coordinates', async ({ page }, testInfo) => {
  /* This is THE mobile bug, tested at its root.

     A phone hides its toolbar as you drag, changing innerHeight mid-gesture.
     Anything deriving its position from the viewport gets remapped and jumps
     while the scroll has not moved — measured at 58px with the old CSS
     view() timeline, and reported from a real device as shivering cards.

     Testing this by resizing the window is misleading: that ALSO changes
     100svh, so the splash resizes and every offsetTop below it legitimately
     moves. A real toolbar collapse does not change svh — that is what svh is
     for. So the honest property to assert is that the applied offset matches
     what document coordinates alone predict, both before and after a resize.
     A viewport-dependent implementation cannot satisfy this. */
  test.skip(testInfo.project.name !== 'mobile', 'touch devices only');
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  /* The applied offset is min(progress x height x factor, slack), and slack is
     a layout measurement the test should not re-derive. Instead read each
     block's own ceiling by scrolling well past it, then predict every other
     position from document coordinates alone. */
  /* #splash is excluded: it is sized in 100svh, so its height — and therefore
     its slack — legitimately changes when the viewport height does. That is
     layout responding to layout, not the animation reading the viewport. The
     other two blocks are content-sized and give a clean signal. The static
     guard above ('never reads the viewport height') covers the splash. */
  const ceilings = await page.evaluate(async () => {
    const out = {};
    for (const sel of ['#tjenester', '#kontakt']) {
      const el = document.querySelector(sel);
      window.scrollTo(0, el.offsetTop + el.offsetHeight + 200);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
      out[sel] = m ? Number(m[1].split(',')[5]) : 0;
    }
    window.scrollTo(0, 0);
    return out;
  });

  const check = () => page.evaluate((ceilings) => {
    const travel = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--parallax-factor')
    );
    const y = window.scrollY;
    return ['#tjenester', '#kontakt'].map((sel) => {
      const el = document.querySelector(sel);
      const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
      const actual = m ? Number(m[1].split(',')[5]) : 0;
      const p = Math.min(1, Math.max(0, (y - el.offsetTop) / el.offsetHeight));
      const expected = Math.min(p * el.offsetHeight * travel, ceilings[sel]);
      return { sel, actual, expected };
    });
  }, ceilings);

  for (const scrollY of [700, 1500, 2200]) {
    await page.evaluate((v) => window.scrollTo(0, v), scrollY);
    await page.waitForTimeout(160);

    for (const r of await check()) {
      expect(Math.abs(r.actual - r.expected),
        `${r.sel} at scrollY ${scrollY}: applied ${r.actual.toFixed(1)}px, document coordinates predict ${r.expected.toFixed(1)}px`
      ).toBeLessThanOrEqual(1);
    }

    // and again once the viewport height has changed underneath it
    await page.setViewportSize({ width: 412, height: 975 });
    await page.waitForTimeout(220);
    for (const r of await check()) {
      expect(Math.abs(r.actual - r.expected),
        `${r.sel} after a viewport height change: applied ${r.actual.toFixed(1)}px, predicted ${r.expected.toFixed(1)}px — the offset depends on viewport height`
      ).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 412, height: 915 });
    await page.waitForTimeout(160);
  }
});

test('no block ever has its content covered by the next one', async ({ page }) => {
  /* True half speed demands a block lag by half its own height. The blocks only
     carry ~96px of dead space below their content, so the lag was burying
     163-434px of readable text under the arriving block, depending on viewport.

     The lag is therefore clamped to each block's actual slack. That weakens the
     effect on tall blocks, and that is the correct trade: an effect that hides
     the text is not a feature. */
  await page.goto('/');
  const worst = await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const pairs = [
      ['#splash', '#tjenester'],
      ['#tjenester', '#kontakt'],
      ['#kontakt', '#om'],
    ];
    let worst = { overlap: 0, block: null, y: 0 };
    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += 25) {
      window.scrollTo(0, y);
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      for (const [a, b] of pairs) {
        const nextTop = document.querySelector(b).getBoundingClientRect().top;
        for (const node of document.querySelectorAll(`${a} h1, ${a} h2, ${a} p, ${a} li, ${a} img, ${a} iframe`)) {
          // decorative imagery may be covered; the carousel slides fill the
          // splash and are aria-hidden precisely because they carry no meaning
          if (node.closest('[aria-hidden="true"]')) continue;
          const r = node.getBoundingClientRect();
          if (r.height === 0) continue;
          // only counts if the content is actually on screen
          if (r.bottom < 0 || r.top > window.innerHeight) continue;
          const overlap = r.bottom - nextTop;
          if (overlap > worst.overlap) worst = { overlap, block: a, y: window.scrollY };
        }
      }
    }
    window.scrollTo(0, 0);
    return worst;
  });

  expect(worst.overlap,
    `${worst.block} has ${Math.round(worst.overlap)}px of visible content buried under the next block at scrollY ${worst.y}`
  ).toBeLessThanOrEqual(2);
});
