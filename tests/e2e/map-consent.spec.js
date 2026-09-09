import { test, expect } from '@playwright/test';

test('no Google request and no cookies before the map is clicked', async ({ page, context }) => {
  // This is a legal requirement, not a preference. Do not weaken this test.
  const googleRequests = [];
  page.on('request', (r) => {
    if (/google\.com|gstatic\.com|googleapis\.com/.test(r.url())) googleRequests.push(r.url());
  });

  await page.goto('/');
  await page.locator('#kontakt').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');

  expect(googleRequests).toEqual([]);
  expect(await page.locator('#kontakt iframe').count()).toBe(0);
  expect(await context.cookies()).toEqual([]);
});

test('clicking the load button inserts the map iframe', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('.map__load');
  await expect(button).toBeVisible();
  await expect(button).toContainText('Vis kart');

  await button.click();

  const frame = page.locator('#kontakt iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', /google\.com\/maps/);
  await expect(button).toHaveCount(0);
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
