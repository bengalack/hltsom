import { test, expect } from '@playwright/test';

/* The contact block ships a static OpenStreetMap image and upgrades to Google's
   interactive embed on click. That click is the consent action, so no cookie
   banner is needed. See docs/decisions/0002-static-map-preview.md.

   The no-cookies-before-consent assertions below are a LEGAL guarantee, not a
   performance preference. Do not weaken them. If one fails, the page started
   loading Google without asking. */

test('no Google request and no cookies before the visitor asks', async ({ page, context }) => {
  const googleRequests = [];
  page.on('request', (r) => {
    if (/google\.com|gstatic\.com|googleapis\.com/.test(r.url())) googleRequests.push(r.url());
  });

  await page.goto('/');
  await page.locator('#kontakt').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  expect(googleRequests, 'nothing may reach Google before the click').toEqual([]);
  expect(await page.locator('#kontakt iframe').count()).toBe(0);
  expect(await context.cookies()).toEqual([]);
});

test('the location is visible without any interaction', async ({ page }) => {
  // The whole point of the preview: seeing where the workshop is costs nothing.
  await page.goto('/');
  const preview = page.locator('.map__preview');
  await expect(preview).toHaveAttribute('src', /map-preview\.webp/);
  const painted = await preview.evaluate((el) => el.complete && el.naturalWidth > 0);
  expect(painted).toBe(true);
});

test('the preview is served from this origin, not a third party', async ({ page }) => {
  await page.goto('/');
  const src = await page.locator('.map__preview').getAttribute('src');
  expect(src.startsWith('assets/')).toBe(true);
});

test('clicking the preview loads the interactive Google map', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.map__load');
  await expect(link).toContainText('Åpne interaktivt kart');

  await link.click();

  const frame = page.locator('#kontakt iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', /google\.com\/maps/);
  await expect(link).toHaveCount(0);
});

test('the visitor is told what the click will do', async ({ page }) => {
  // Consent means informed consent: the cookie consequence must be stated.
  await page.goto('/');
  await expect(page.locator('.map__cta-note')).toContainText('informasjonskapsler');
});

test('without JavaScript the map is still reachable as a link', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  const href = await page.locator('.map__load').getAttribute('href');
  expect(href).toMatch(/google\.com\/maps/);
  await expect(page.locator('.map__preview')).toBeVisible();
  await ctx.close();
});

test('the OpenStreetMap attribution is present and visible', async ({ page }) => {
  // Required by the ODbL licence for the tiles the preview is built from.
  await page.goto('/');
  const attribution = page.locator('.map__attribution');
  await expect(attribution).toBeVisible();
  await expect(attribution).toContainText('OpenStreetMap');
  await expect(attribution.locator('a')).toHaveAttribute('href', /openstreetmap\.org\/copyright/);
});

test('contact details are tappable links', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#kontakt a[href^="tel:"]')).toHaveCount(1);
  await expect(page.locator('#kontakt a[href^="mailto:"]')).toHaveCount(1);
});

test('on mobile the contact details come BEFORE the map', async ({ page }, testInfo) => {
  // Spec 3.6: block 3 is the deliberate exception to image-first stacking.
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
