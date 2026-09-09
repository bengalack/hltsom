import { test, expect } from '@playwright/test';

test('services block lists the services', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#tjenester h2')).toHaveText('Tjenester');
  expect(await page.locator('#tjenester li').count()).toBeGreaterThanOrEqual(4);
});

test('about block has a heading and prose', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#om h2')).toHaveText('Om meg');
  const text = await page.locator('#om .split__body p').first().innerText();
  expect(text.length).toBeGreaterThan(60);
});

test('every image has non-empty alt text or is explicitly decorative', async ({ page }) => {
  await page.goto('/');
  const missing = await page.locator('img').evaluateAll((imgs) =>
    imgs.filter((i) => i.getAttribute('alt') === null).map((i) => i.src)
  );
  expect(missing).toEqual([]);
});

test('on mobile the image comes before the text in blocks 2 and 4', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile stacking only');
  await page.goto('/');
  for (const id of ['#tjenester', '#om']) {
    const media = await page.locator(`${id} .split__media`).boundingBox();
    const body = await page.locator(`${id} .split__body`).boundingBox();
    expect(media.y).toBeLessThan(body.y);
  }
});

test('on desktop blocks 2 and 4 place the image on the left', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop layout only');
  await page.goto('/');
  for (const id of ['#tjenester', '#om']) {
    const media = await page.locator(`${id} .split__media`).boundingBox();
    const body = await page.locator(`${id} .split__body`).boundingBox();
    expect(media.x).toBeLessThan(body.x);
  }
});
