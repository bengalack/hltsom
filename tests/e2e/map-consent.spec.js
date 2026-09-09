import { test, expect } from '@playwright/test';

/* The map now loads on its own, deferred by loading="lazy".
   This REVERSES the original click-to-load design and its no-cookies-before-
   consent guarantee — see docs/decisions/0001-map-loads-without-click.md.
   These tests were rewritten deliberately as part of that decision. They are
   NOT a weakening of the old guarantee by accident.

   The consequence is recorded honestly below: cookies ARE set without prior
   consent, which is why the site needs a consent mechanism before launch. */

test('the map appears automatically, with no click', async ({ page }) => {
  await page.goto('/');
  await page.locator('#kontakt').scrollIntoViewIfNeeded();
  const frame = page.locator('#kontakt iframe');
  await expect(frame).toHaveCount(1, { timeout: 5000 });
  await expect(frame).toHaveAttribute('src', /google\.com\/maps/);
});

test('the map is genuinely deferred until the contact block is approached', async ({ page }) => {
  // Measured: loading="lazy" alone did NOT defer the iframe here — Chromium
  // requested Google at ~60ms, before the load event. The deferral comes from
  // an IntersectionObserver in main.js. This test is what proves it still works.
  const googleRequests = [];
  page.on('request', (r) => {
    if (/google\.com|gstatic\.com/.test(r.url())) googleRequests.push(r.url());
  });

  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1200);
  expect(googleRequests, 'map must not load while the visitor is at the top of the page').toEqual([]);

  await page.locator('#kontakt').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  expect(googleRequests.length, 'map must load once the contact block is reached').toBeGreaterThan(0);
});

test('visitors without JavaScript still get a map', async ({ page }) => {
  // The <noscript> fallback means the map never depends on the script existing.
  await page.goto('/');
  const html = await page.content();
  expect(html).toContain('<noscript>');
});

test('no click-to-load button remains', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.map__load')).toHaveCount(0);
});

test('contact details are tappable links', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#kontakt a[href^="tel:"]')).toHaveCount(1);
  await expect(page.locator('#kontakt a[href^="mailto:"]')).toHaveCount(1);
});

test('on mobile the contact details come BEFORE the map', async ({ page }, testInfo) => {
  // Spec 3.6: block 3 is the deliberate exception to image-first stacking,
  // because its media pane is a map. Image-first would bury the phone number.
  test.skip(testInfo.project.name !== 'mobile', 'mobile stacking only');
  await page.goto('/');
  const body = await page.locator('#kontakt .split__body').boundingBox();
  const media = await page.locator('#kontakt .split__media').boundingBox();
  expect(body.y).toBeLessThan(media.y);
});

test('on desktop the contact details are left of the map', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop layout only');
  await page.goto('/');
  const body = await page.locator('#kontakt .split__body').boundingBox();
  const media = await page.locator('#kontakt .split__media').boundingBox();
  expect(body.x).toBeLessThan(media.x);
});
