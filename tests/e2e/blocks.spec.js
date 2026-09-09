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

test('block images are circular, with a transparent surround', async ({ page }) => {
  // The passepartout is a crop, not a frame: the page ground shows around the
  // circle, so the photograph reads as an object rather than a pasted rectangle.
  await page.goto('/');
  for (const sel of ['#tjenester .split__figure', '#om .split__figure']) {
    const fig = page.locator(sel);
    const box = await fig.boundingBox();
    expect(Math.abs(box.width - box.height), `${sel} is not square`).toBeLessThanOrEqual(1.5);

    const style = await fig.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { radius: cs.borderRadius, overflow: cs.overflow, bg: cs.backgroundColor };
    });
    expect(style.radius, `${sel} is not round`).toMatch(/50%/);
    expect(style.overflow).toBe('hidden');
    // transparent surround: no painted background on the mount itself
    expect(style.bg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  }
});

test('block images actually load', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['#tjenester .split__figure img', '#om .split__figure img']) {
    const painted = await page.locator(sel).evaluate((el) => el.complete && el.naturalWidth > 0);
    expect(painted, `${sel} did not load`).toBe(true);
  }
});

test('block images are square sources, matching the circular crop', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['#tjenester .split__figure img', '#om .split__figure img']) {
    const d = await page.locator(sel).evaluate((el) => ({ w: el.naturalWidth, h: el.naturalHeight }));
    expect(d.w, `${sel} is not a square source`).toBe(d.h);
  }
});
