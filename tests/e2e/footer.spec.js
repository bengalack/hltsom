import { test, expect } from '@playwright/test';

test('footer is dark, centred, and holds org number, email and phone', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer).toHaveCSS('text-align', 'center');
  await expect(footer).toContainText('Organisasjonsnummer');
  await expect(footer).toContainText('E-post');
  await expect(footer).toContainText('Telefon');
  await expect(footer).toHaveCSS('background-color', 'rgb(23, 19, 16)');
});

test('footer contrasts with the block above it', async ({ page }) => {
  await page.goto('/');
  const above = await page.locator('#om').evaluate((el) => getComputedStyle(el).backgroundColor);
  const footer = await page.locator('.site-footer').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(above).not.toBe(footer);
});

test('each footer detail stays on one line', async ({ page }) => {
  /* Requirement: an individual piece of information must never break across
     two lines. "Organisasjonsnummer: 000 000 000", "E-post: ..." and
     "Telefon: 00 99 88 77" each stay whole; the line may only wrap BETWEEN
     them, at a separator. Held together with non-breaking spaces.

     A part that wraps produces more than one client rect, which is what this
     measures — on a narrow phone the whole line cannot fit, so this fails the
     moment a hard space is replaced with an ordinary one. */
  await page.goto('/');
  const parts = page.locator('.site-footer__part');
  await expect(parts).toHaveCount(3);

  /* Count distinct line positions, not client rects. An inline element with a
     nested link reports several rects on a single line — "Telefon: 00 99 88 77"
     gives two — so counting rects reports wrapping that is not there. */
  const rects = await parts.evaluateAll((els) =>
    els.map((el) => ({
      text: el.textContent.trim().slice(0, 32),
      lines: new Set([...el.getClientRects()].map((r) => Math.round(r.top))).size,
    }))
  );
  for (const r of rects) {
    expect(r.lines, `"${r.text}" wrapped onto ${r.lines} lines`).toBe(1);
  }
});

test('the footer details are not dimmed like the separators', async ({ page }) => {
  // Regression guard: the separator styling used to match every span in the
  // footer, so wrapping the details in spans would have faded them to 40%.
  await page.goto('/');
  const opacity = await page.locator('.site-footer__part').first()
    .evaluate((el) => getComputedStyle(el).opacity);
  expect(opacity).toBe('1');
});
