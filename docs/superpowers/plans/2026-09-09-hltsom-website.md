# HLT Søm Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-page, mobile-first Norwegian website for a Bærum tailoring business, deployed on GitHub Pages with no build step.

**Architecture:** A single hand-written `index.html` with four full-height contrasting blocks and a slim footer, styled by one CSS file driven by custom-property design tokens, plus ~60 lines of vanilla JS for three jobs only (burger overlay, splash carousel, click-to-load map). Parallax uses CSS scroll-driven animations, so it costs zero JavaScript. An isolated `tests/` folder holds Playwright specs; it is developer tooling and is never deployed.

**Tech Stack:** HTML5, plain CSS (custom properties, Grid, Flexbox), vanilla JS, self-hosted woff2 fonts, GitHub Pages, Playwright (tests only).

**Spec:** `docs/superpowers/specs/2026-09-09-hltsom-website-design.md`

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **Language:** Norwegian bokmål only. `<html lang="nb">`. All visible copy in Norwegian.
- **No build step for the site.** No `package.json` at the repository root. `index.html`, CSS and JS are served exactly as committed. `tests/package.json` is the sole permitted exception and is never deployed.
- **All asset paths must be relative** (`assets/img/…`), never root-absolute (`/assets/img/…`). The site runs at `https://bengalack.github.io/hltsom/` today and at `https://hltsom.no/` later; a root-absolute path works in exactly one of those and breaks silently in the other.
- **No visible header.** The logo (top-left) and burger (top-right) are fixed floating elements.
- **No cookies may be set before the visitor clicks "Vis kart".** The map iframe must not exist in the DOM until then. Adding any cookie-setting third party requires an ADR.
- **No Google Fonts CDN.** Fonts are self-hosted woff2 from `assets/fonts/`.
- **Viewport units:** use `100svh` / `100dvh`, never `100vh` (iOS Safari address-bar collapse).
- **Typography:** wordmark is lowercase `søm` in Cormorant Infant Italic 400. UI/body is Inter (200–400).
- **Colours:** `--ink: #14110f`, `--paper: #fdfcfa`. Spacing on a 4px scale.
- **Motion timings:** carousel hold `5s`, crossfade `1200ms`, parallax factor `0.5`.
- **`prefers-reduced-motion: reduce` must disable** the carousel, the parallax and smooth scrolling.
- **Block order:** ① Splash (dark) → ② Tjenester (white) → ③ Kontakt (black) → ④ Om meg (white) → footer (black).
- **Mobile stacking:** blocks 2 and 4 stack image-first, text-second. **Block 3 is the deliberate exception — text first, map second** (spec §3.6): its media pane is a map, and image-first would bury the phone number behind a grey placeholder box.
- **Stacking order:** `.site-nav` must sit *above* `.nav-overlay`, so the burger stays clickable to dismiss the open menu.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `CLAUDE.md` | Constraints auto-loaded by future agents; points at spec and ADRs |
| `README.md` | Human orientation: what this is, how to run, how to deploy |
| `index.html` | The entire page: all four blocks, footer, nav, metadata, structured data |
| `assets/css/style.css` | Design tokens, layout, blocks, motion, reduced-motion overrides |
| `assets/js/main.js` | Burger overlay, carousel, click-to-load map. Nothing else |
| `assets/fonts/*.woff2` | Self-hosted Inter + Cormorant Infant |
| `assets/img/*.svg` | Placeholder imagery until real photography exists |
| `robots.txt`, `sitemap.xml` | Crawl directives |
| `docs/decisions/README.md` | How to write an ADR |
| `docs/image-spec.md` | Per-slot photo requirements and the `<picture>` swap recipe |
| `tools/optimize-images.md` | How to export a new photo without adding repo dependencies |
| `tests/package.json` | Isolated Playwright + static-server deps |
| `tests/playwright.config.js` | Serves the repo root on port 5173 |
| `tests/e2e/*.spec.js` | One spec file per behavioural area |

---

## Task 1: Test harness and page skeleton

**Files:**
- Create: `tests/package.json`, `tests/playwright.config.js`, `tests/.gitignore`, `tests/e2e/skeleton.spec.js`, `tests/e2e/hygiene.spec.js`
- Create: `index.html`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a running Playwright harness with `baseURL: http://localhost:5173`, serving the repo root. All later specs assume `page.goto('/')` loads `index.html`. Produces `index.html` with `<html lang="nb">` and `<title>HLT Søm — skredder i Bærum</title>`.

- [ ] **Step 1: Create the test harness config**

`tests/package.json`:

```json
{
  "name": "hltsom-tests",
  "private": true,
  "description": "Developer tooling only. Never deployed. Safe to delete.",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "serve": "^14.2.4"
  }
}
```

`tests/playwright.config.js`:

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx serve .. -l 5173 --no-clipboard',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

`tests/.gitignore`:

```
node_modules/
test-results/
playwright-report/
```

- [ ] **Step 2: Write the failing tests**

`tests/e2e/skeleton.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('page loads with Norwegian language and a descriptive title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/HLT Søm/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
});

test('page has exactly one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('all four blocks are present in order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section').evaluateAll(
    (els) => els.map((e) => e.id)
  );
  expect(ids).toEqual(['splash', 'tjenester', 'kontakt', 'om']);
});
```

`tests/e2e/hygiene.spec.js` — these guard the constraints most likely to be broken later:

```js
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('no package.json at the repository root', () => {
  expect(existsSync(resolve(repoRoot, 'package.json'))).toBe(false);
});

test('no root-absolute asset paths in index.html', () => {
  const html = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
  const offenders = [...html.matchAll(/(?:src|href)="(\/[^/][^"]*)"/g)].map((m) => m[1]);
  expect(offenders).toEqual([]);
});
```

- [ ] **Step 3: Install dependencies and run the tests to verify they fail**

```bash
cd tests && npm install && npx playwright install chromium
npx playwright test
```

Expected: FAIL. The server returns 404 for `/` because `index.html` does not exist yet.

- [ ] **Step 4: Write the minimal `index.html`**

```html
<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HLT Søm — skredder i Bærum</title>
  <meta name="description" content="HLT Søm er en lokal skredder i Bærum. Legging av bukser, skifte av glidelås, tilpasning og reparasjon av klær.">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <main>
    <section id="splash">
      <h1>søm</h1>
    </section>
    <section id="tjenester">
      <h2>Tjenester</h2>
    </section>
    <section id="kontakt">
      <h2>Kontakt</h2>
    </section>
    <section id="om">
      <h2>Om meg</h2>
    </section>
  </main>
</body>
</html>
```

Create an empty `assets/css/style.css` so the stylesheet link does not 404.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd tests && npx playwright test
```

Expected: PASS, all 5 tests across both projects.

- [ ] **Step 6: Commit**

```bash
git add index.html assets tests .gitignore
git commit -m "feat: add page skeleton and isolated Playwright harness"
```

---

## Task 2: Governance documents

**Files:**
- Create: `CLAUDE.md`, `README.md`, `docs/decisions/README.md`, `docs/image-spec.md`, `tools/optimize-images.md`
- Test: `tests/e2e/governance.spec.js`

**Interfaces:**
- Consumes: the spec at `docs/superpowers/specs/2026-09-09-hltsom-website-design.md`
- Produces: `CLAUDE.md`, which every future agent session loads automatically. This is the task that makes the whole decision-storage scheme actually work.

- [ ] **Step 1: Write the failing test**

`tests/e2e/governance.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(resolve(repoRoot, p), 'utf8');

test('CLAUDE.md exists and points at the spec and the ADR folder', () => {
  const md = read('CLAUDE.md');
  expect(md).toContain('docs/superpowers/specs/2026-09-09-hltsom-website-design.md');
  expect(md).toContain('docs/decisions/');
});

test('CLAUDE.md states the six load-bearing constraints', () => {
  const md = read('CLAUDE.md').toLowerCase();
  for (const needle of [
    'no build step',
    'no visible header',
    'norwegian',
    'before consent',
    'relative',
    'google fonts',
  ]) {
    expect(md).toContain(needle);
  }
});

test('supporting docs exist', () => {
  for (const p of ['docs/decisions/README.md', 'docs/image-spec.md', 'tools/optimize-images.md', 'README.md']) {
    expect(existsSync(resolve(repoRoot, p))).toBe(true);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/governance.spec.js
```

Expected: FAIL with `ENOENT: no such file or directory ... CLAUDE.md`.

- [ ] **Step 3: Write `CLAUDE.md`**

```markdown
# HLT Søm — working agreement

One-page website for a tailoring business in Bærum, Norway.

**Before changing anything, read:**
1. `docs/superpowers/specs/2026-09-09-hltsom-website-design.md` — the living design spec
2. `docs/decisions/` — ADRs recording anything that later reversed the spec

## Load-bearing constraints

These look like things worth "fixing". They are not. Each was decided deliberately.

1. **No build step, no dependencies for the site.** No `package.json` at the repo root.
   `tests/` has its own — that is developer tooling, never deployed.
2. **No visible header.** The floating logo and burger are the navigation, on purpose.
3. **Norwegian bokmål only.** No English, no language switcher.
4. **No cookies before consent.** The Google Map must not enter the DOM until the visitor
   clicks "Vis kart". This is a legal requirement, not a performance trick.
5. **Relative asset paths only** (`assets/…`, never `/assets/…`). The site moves from a
   GitHub Pages subpath to an apex domain; root-absolute paths break silently on one of them.
6. **No Google Fonts CDN.** Fonts are self-hosted in `assets/fonts/`.

## How to change a decision

- Ordinary iteration (content, wording, spacing, timings, a new service, a swapped photo):
  edit the spec in place. No ceremony.
- Reversing a decision above, or adding a lasting constraint: write an ADR in
  `docs/decisions/`, then edit the spec to match and link the ADR.

## Testing

```bash
cd tests && npm install && npx playwright test
```
```

- [ ] **Step 4: Write `docs/decisions/README.md`**

```markdown
# Architecture Decision Records

An ADR is written only when a decision **reverses** something in the design spec, or adds a
lasting constraint. Ordinary iteration is just a spec edit.

Filename: `NNNN-short-kebab-title.md`, numbered sequentially from `0001`.

## Template

```markdown
# NNNN — <title>

**Date:** YYYY-MM-DD
**Status:** Accepted
**Supersedes:** <spec section, e.g. "§3.3 and decision D6">

## Context
What changed in the world that made the previous decision wrong?

## Decision
What we are doing instead.

## Consequences
What this costs, and what now becomes possible or impossible.
```

After writing an ADR, edit the spec so it describes the new reality, and link back here.
```

- [ ] **Step 5: Write `docs/image-spec.md`**

```markdown
# Image specification

No real photography exists yet. Every image in `assets/img/` is a placeholder SVG.

## The hard rule

**Carousel images must have a dark, visually quiet centre.** The wordmark `søm` sits there in
white, in a light italic serif. A fixed scrim gradient provides a floor of protection, but a
bright or busy centre still defeats it. Verify the wordmark after every photo swap.

## Slots

| Slot | File stem | Aspect | Min resolution | Subject |
|---|---|---|---|---|
| Splash carousel | `splash-1`, `splash-2`, … | Fills viewport; crops from centre | 2400×1600 | Workshop, fabric, hands at work. Dark, quiet centre |
| Block 2 (Tjenester) | `tjenester` | 4:5 portrait | 1200×1500 | Work in progress: pinning, hemming, a machine |
| Block 4 (Om meg) | `om` | 4:5 portrait | 1200×1500 | The tailor herself. A face builds more trust than any copy |
| Logo | `logo` | 1:1 | 400×400, or SVG | Simple enough to read at 100×100 |

## Swapping a placeholder for a real photo

1. Export per `tools/optimize-images.md` → produces `name.avif`, `name.webp`, `name.jpg`.
2. Replace the `<img>` inside the relevant `<picture>` and add the two `<source>` lines:

```html
<picture>
  <source srcset="assets/img/tjenester.avif" type="image/avif">
  <source srcset="assets/img/tjenester.webp" type="image/webp">
  <img src="assets/img/tjenester.jpg" width="1200" height="1500" alt="..." loading="lazy" decoding="async">
</picture>
```

3. Keep `width` and `height` accurate — they prevent layout shift, which is a scored Lighthouse metric.
4. Write real Norwegian `alt` text describing the content, not the word "bilde".
5. Re-run `cd tests && npx playwright test`.
```

- [ ] **Step 6: Write `tools/optimize-images.md`**

```markdown
# Preparing images

Image tooling is deliberately **outside** this repository, so the site stays dependency-free.
Use either route; both produce the same three files.

## Route A — Squoosh (no install)

<https://squoosh.app>. For each photo, export three times:
- AVIF, quality 50 → `name.avif`
- WebP, quality 75 → `name.webp`
- MozJPEG, quality 78 → `name.jpg`

Resize the longest edge to 2400px for splash images, 1500px for block images.

## Route B — ImageMagick (local)

```bash
magick input.jpg -resize 2400x2400\> -quality 50 name.avif
magick input.jpg -resize 2400x2400\> -quality 75 name.webp
magick input.jpg -resize 2400x2400\> -quality 78 -strip name.jpg
```

Commit all three. Then follow the swap steps in `docs/image-spec.md`.
```

- [ ] **Step 7: Write `README.md`**

```markdown
# HLT Søm

One-page website for HLT Søm, a tailoring business in Bærum, Norway.

Live: <https://bengalack.github.io/hltsom/> (moving to <https://hltsom.no> once registered)

## Working on it

There is no build step. Open `index.html` in a browser, or serve the folder:

```bash
npx serve . -l 5173
```

## Tests

```bash
cd tests && npm install && npx playwright install chromium && npx playwright test
```

## Deploying

Push to `main`. GitHub Pages serves the repository root.

## Before you change anything

Read `CLAUDE.md`, then `docs/superpowers/specs/2026-09-09-hltsom-website-design.md`.
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
cd tests && npx playwright test e2e/governance.spec.js
```

Expected: PASS, 3 tests per project.

- [ ] **Step 9: Commit**

```bash
git add CLAUDE.md README.md docs tools tests
git commit -m "docs: add governance, image spec and image tooling docs"
```

---

## Task 3: Design tokens, base styles and self-hosted fonts

**Files:**
- Create: `assets/fonts/` (4 woff2 files)
- Modify: `assets/css/style.css`, `index.html`
- Test: `tests/e2e/typography.spec.js`

**Interfaces:**
- Consumes: `index.html` skeleton from Task 1
- Produces: CSS custom properties `--ink`, `--paper`, `--scrim-top`, `--scrim-bottom`, `--carousel-interval`, `--crossfade`, `--parallax-factor`, `--space-1`…`--space-12`; font families `"Cormorant Infant"` and `"Inter"`; utility classes `.block`, `.block--light`, `.block--dark`.

- [ ] **Step 1: Download the font files**

Fetch the Google Fonts CSS (the `User-Agent` matters — it decides whether you get woff2), then download only the **latin** subset files. The latin subset covers `æ ø å` (U+00C0–U+00FF), so no subsetting tool is needed.

```bash
mkdir -p assets/fonts
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
curl -s -H "User-Agent: $UA" \
  'https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400&family=Cormorant+Infant:ital,wght@1,400&display=swap'
```

Google returns one `@font-face` block per subset, each preceded by a `/* subset */` comment. You
want the four blocks commented `/* latin */`. Fetch each family separately so the order is
unambiguous, and let the shell pick the right block:

```bash
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Inter: three weights, one file each
for W in 200 300 400; do
  curl -s -H "User-Agent: $UA" \
    "https://fonts.googleapis.com/css2?family=Inter:wght@${W}&display=swap" \
  | awk '/\/\* latin \*\//{f=1} f && /src:/{print; exit}' \
  | grep -o 'https://[^)]*\.woff2' \
  | xargs curl -s -o "assets/fonts/inter-${W}.woff2"
done

# Cormorant Infant italic 400
curl -s -H "User-Agent: $UA" \
  'https://fonts.googleapis.com/css2?family=Cormorant+Infant:ital,wght@1,400&display=swap' \
| awk '/\/\* latin \*\//{f=1} f && /src:/{print; exit}' \
| grep -o 'https://[^)]*\.woff2' \
| xargs curl -s -o assets/fonts/cormorant-infant-italic-400.woff2
```

The `awk` picks the first `src:` line *after* the `/* latin */` marker, which is the latin
subset URL. If a family's CSS ever changes shape, run the bare `curl` from the previous step and
copy the URL by hand — the four filenames above are what the CSS in Step 4 expects.

Verify each file is a real font and not an HTML error page:

```bash
ls -l assets/fonts/    # each should be >10KB
file assets/fonts/*.woff2   # "Web Open Font Format (Version 2)"
```

- [ ] **Step 2: Write the failing test**

`tests/e2e/typography.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('wordmark renders in Cormorant Infant italic', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveText('søm');
  const family = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('Cormorant Infant');
  await expect(h1).toHaveCSS('font-style', 'italic');
});

test('body text renders in Inter', async ({ page }) => {
  await page.goto('/');
  const family = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('Inter');
});

test('fonts are loaded from this origin, never from Google', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) external.push(u);
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
});

test('design tokens are defined on :root', async ({ page }) => {
  await page.goto('/');
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      ink: s.getPropertyValue('--ink').trim(),
      paper: s.getPropertyValue('--paper').trim(),
      interval: s.getPropertyValue('--carousel-interval').trim(),
    };
  });
  expect(tokens.ink).toBe('#14110f');
  expect(tokens.paper).toBe('#fdfcfa');
  expect(tokens.interval).toBe('5s');
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/typography.spec.js
```

Expected: FAIL — `--ink` resolves to an empty string and `fontFamily` is the browser default.

- [ ] **Step 4: Write the stylesheet**

`assets/css/style.css`:

```css
/* ============================================================
   HLT Søm — design tokens
   Change the look here. Avoid hard-coding values further down.
   ============================================================ */
:root {
  --ink:   #14110f;   /* near-black, warmer than #000 */
  --paper: #fdfcfa;   /* off-white; pure #fff glares on phones */

  --scrim-top:    rgba(18, 15, 12, .42);
  --scrim-bottom: rgba(18, 15, 12, .60);

  --carousel-interval: 5s;
  --crossfade: 1200ms;
  --parallax-factor: .5;

  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-6: 24px;  --space-8: 32px;  --space-12: 48px; --space-16: 64px;
  --space-24: 96px;

  --measure: 62ch;  /* max line length for readable body copy */
}

@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-200.woff2') format('woff2');
  font-weight: 200; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-300.woff2') format('woff2');
  font-weight: 300; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-400.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Cormorant Infant';
  src: url('../fonts/cormorant-infant-italic-400.woff2') format('woff2');
  font-weight: 400; font-style: italic; font-display: swap;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 300;
  font-size: 17px;
  line-height: 1.7;
  color: var(--ink);
  background: var(--paper);
}

img, picture, iframe { max-width: 100%; display: block; }

h1, h2 { font-weight: 400; margin: 0; }

h1 {
  font-family: 'Cormorant Infant', Georgia, serif;
  font-style: italic;
  font-weight: 400;
  line-height: .9;
}

a { color: inherit; }

/* ---------- block scaffolding ---------- */
.block { padding: var(--space-24) var(--space-6); }
.block--light { background: var(--paper); color: var(--ink); }
.block--dark  { background: var(--ink);   color: var(--paper); }

:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
```

- [ ] **Step 5: Update `index.html` to use the classes**

Replace the `<main>` contents so each section carries its background class, and the `h1` holds the wordmark:

```html
  <main>
    <section id="splash">
      <h1>søm</h1>
    </section>
    <section id="tjenester" class="block block--light">
      <h2>Tjenester</h2>
    </section>
    <section id="kontakt" class="block block--dark">
      <h2>Kontakt</h2>
    </section>
    <section id="om" class="block block--light">
      <h2>Om meg</h2>
    </section>
  </main>
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd tests && npx playwright test
```

Expected: PASS. All Task 1 and 2 tests still pass.

- [ ] **Step 7: Commit**

```bash
git add assets index.html
git commit -m "feat: add design tokens, base styles and self-hosted fonts"
```

---

## Task 4: Block 1 — splash

**Files:**
- Create: `assets/img/splash-1.svg`, `assets/img/splash-2.svg`, `assets/img/logo.svg`
- Modify: `index.html`, `assets/css/style.css`
- Test: `tests/e2e/splash.spec.js`

**Interfaces:**
- Consumes: tokens from Task 3
- Produces: `<section id="splash">` containing `.splash__slides` with `.splash__slide` children (first one carries `.is-active`), `.splash__scrim`, `h1.splash__mark`, `p.splash__tagline`. Task 5 attaches the carousel to `.splash__slide` elements and toggles `.is-active`.

- [ ] **Step 1: Create placeholder images**

Placeholder SVGs, not JPEGs — they need no tooling, weigh nothing, and their dark centre matches what the real photos must provide.

`assets/img/splash-1.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="g1" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#2c2620"/>
      <stop offset="100%" stop-color="#100d0a"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g1)"/>
  <text x="600" y="770" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#6b6055">PLASSHOLDER — splash 1</text>
</svg>
```

`assets/img/splash-2.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="g2" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#332b22"/>
      <stop offset="100%" stop-color="#0d0b09"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g2)"/>
  <text x="600" y="770" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#6b6055">PLASSHOLDER — splash 2</text>
</svg>
```

Both use a radial gradient that is darkest at the centre — the same property the real
photographs must have, so the wordmark is being tested against a realistic worst case rather
than a flattering one.

`assets/img/logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="1" y="1" width="98" height="98" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="50" y="56" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="30" fill="currentColor">HLT</text>
</svg>
```

- [ ] **Step 2: Write the failing test**

`tests/e2e/splash.spec.js`:

```js
import { test, expect } from '@playwright/test';

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

test('splash has at least one slide and the first is active', async ({ page }) => {
  await page.goto('/');
  const slides = page.locator('.splash__slide');
  expect(await slides.count()).toBeGreaterThan(0);
  await expect(slides.first()).toHaveClass(/is-active/);
});

test('splash height uses svh, not vh', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../../assets/css/style.css', import.meta.url), 'utf8');
  expect(css).toContain('100svh');
  expect(css).not.toMatch(/height:\s*100vh/);
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/splash.spec.js
```

Expected: FAIL — `.splash__mark` does not exist.

- [ ] **Step 4: Write the splash markup**

Replace `<section id="splash">` in `index.html`:

```html
    <section id="splash" class="splash">
      <div class="splash__slides" aria-hidden="true">
        <div class="splash__slide is-active" style="background-image:url('assets/img/splash-1.svg')"></div>
        <div class="splash__slide" style="background-image:url('assets/img/splash-2.svg')"></div>
      </div>
      <div class="splash__scrim" aria-hidden="true"></div>
      <div class="splash__content">
        <h1 class="splash__mark">søm</h1>
        <p class="splash__tagline">Godt håndverk, lokalt i Bærum</p>
      </div>
      <span class="splash__cue" aria-hidden="true"></span>
    </section>
```

- [ ] **Step 5: Write the splash styles**

Append to `assets/css/style.css`:

```css
/* ---------- block 1: splash ---------- */
.splash {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--ink);
}

.splash__slides { position: absolute; inset: 0; }

.splash__slide {
  position: absolute; inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity var(--crossfade) ease-in-out;
}
.splash__slide.is-active { opacity: 1; }

.splash__scrim {
  position: absolute; inset: 0;
  background: linear-gradient(var(--scrim-top), var(--scrim-bottom));
}

.splash__content {
  position: relative;
  text-align: center;
  padding: 0 var(--space-6) var(--space-16);
  color: #fff;
}

.splash__mark {
  font-size: clamp(76px, 22vw, 190px);
  letter-spacing: .005em;
  margin: 0;
  text-shadow: 0 2px 30px rgba(0, 0, 0, .35);
}

.splash__tagline {
  margin: var(--space-6) 0 0;
  font-weight: 200;
  font-size: clamp(11px, 2.8vw, 14px);
  letter-spacing: .19em;
  text-transform: uppercase;
  text-align: center;
  text-shadow: 0 1px 14px rgba(0, 0, 0, .45);
}

.splash__cue {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  width: 1px; height: 30px;
  transform: translateX(-50%);
  background: linear-gradient(rgba(255,255,255,0), rgba(255,255,255,.85));
}
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd tests && npx playwright test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html assets
git commit -m "feat: add splash block with wordmark, tagline and scrim"
```

---

## Task 5: Splash carousel

**Files:**
- Create: `assets/js/main.js`
- Modify: `index.html`
- Test: `tests/e2e/carousel.spec.js`

**Interfaces:**
- Consumes: `.splash__slide` elements and `.is-active` from Task 4
- Produces: `assets/js/main.js`, loaded with `defer`. Later tasks append to this same file. Exposes nothing globally; each feature is a self-invoking `init` function guarded by a null check on its root element.

- [ ] **Step 1: Write the failing test**

`tests/e2e/carousel.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('carousel advances to the second slide', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.splash__slide').first()).toHaveClass(/is-active/);
  await expect(page.locator('.splash__slide').nth(1)).toHaveClass(/is-active/, { timeout: 9000 });
});

test('carousel does not advance under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(7000);
  await expect(page.locator('.splash__slide').first()).toHaveClass(/is-active/);
  await expect(page.locator('.splash__slide').nth(1)).not.toHaveClass(/is-active/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/carousel.spec.js
```

Expected: FAIL — the second slide never becomes active because no script runs.

- [ ] **Step 3: Write the carousel**

`assets/js/main.js`:

```js
/* HLT Søm — the only JavaScript on this site.
   Three jobs: carousel, burger overlay, click-to-load map. Nothing else. */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- splash carousel ---------- */
function initCarousel() {
  const slides = Array.from(document.querySelectorAll('.splash__slide'));
  if (slides.length < 2 || prefersReducedMotion()) return;

  const styles = getComputedStyle(document.documentElement);
  const seconds = parseFloat(styles.getPropertyValue('--carousel-interval')) || 5;
  const intervalMs = seconds * 1000;

  let index = 0;
  let timer = null;

  const advance = () => {
    slides[index].classList.remove('is-active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('is-active');
  };

  const start = () => { if (timer === null) timer = setInterval(advance, intervalMs); };
  const stop = () => { clearInterval(timer); timer = null; };

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  start();
}

initCarousel();
```

- [ ] **Step 4: Load the script from `index.html`**

Add before `</body>`:

```html
  <script src="assets/js/main.js" defer></script>
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd tests && npx playwright test e2e/carousel.spec.js
```

Expected: PASS, 2 tests per project.

- [ ] **Step 6: Commit**

```bash
git add index.html assets/js/main.js
git commit -m "feat: add splash carousel with reduced-motion and tab-visibility handling"
```

---

## Task 6: Fixed navigation and burger overlay

**Files:**
- Modify: `index.html`, `assets/css/style.css`, `assets/js/main.js`
- Test: `tests/e2e/nav.spec.js`

**Interfaces:**
- Consumes: `initCarousel` pattern and `prefersReducedMotion()` from Task 5
- Produces: `.site-nav` (fixed), `.site-nav__logo`, `button.site-nav__burger` with `aria-expanded` and `aria-controls="meny"`, and `#meny.nav-overlay` containing four anchors to `#splash`, `#tjenester`, `#kontakt`, `#om`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/nav.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('logo and burger are fixed and always visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-nav')).toHaveCSS('position', 'fixed');
  await page.locator('#om').scrollIntoViewIfNeeded();
  await expect(page.locator('.site-nav__burger')).toBeVisible();
});

test('burger opens an overlay with four block links', async ({ page }) => {
  await page.goto('/');
  const burger = page.locator('.site-nav__burger');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  const links = page.locator('#meny a');
  await expect(links).toHaveCount(4);
  await expect(links.nth(0)).toHaveAttribute('href', '#splash');
  await expect(links.nth(1)).toHaveAttribute('href', '#tjenester');
  await expect(links.nth(2)).toHaveAttribute('href', '#kontakt');
  await expect(links.nth(3)).toHaveAttribute('href', '#om');
});

test('Escape closes the overlay and returns focus to the burger', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav__burger').click();
  await expect(page.locator('#meny')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#meny')).toBeHidden();
  await expect(page.locator('.site-nav__burger')).toBeFocused();
});

test('clicking a link closes the overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav__burger').click();
  await page.locator('#meny a[href="#kontakt"]').click();
  await expect(page.locator('#meny')).toBeHidden();
});

test('the burger itself closes the open overlay', async ({ page }) => {
  // Regression guard: if .site-nav sinks below .nav-overlay in the stacking
  // order, the burger is covered and this click silently hits the overlay.
  await page.goto('/');
  const burger = page.locator('.site-nav__burger');
  await burger.click();
  await expect(page.locator('#meny')).toBeVisible();
  await burger.click();
  await expect(page.locator('#meny')).toBeHidden();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

test('focus is trapped inside the open overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav__burger').click();
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() =>
    document.getElementById('meny').contains(document.activeElement)
  );
  expect(inside).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/nav.spec.js
```

Expected: FAIL — `.site-nav` does not exist.

- [ ] **Step 3: Write the markup**

Insert immediately after `<body>` in `index.html`:

```html
  <nav class="site-nav">
    <a class="site-nav__logo" href="#splash" aria-label="HLT Søm — til toppen">
      <img src="assets/img/logo.svg" width="100" height="100" alt="">
    </a>
    <button class="site-nav__burger" type="button" aria-expanded="false" aria-controls="meny">
      <span class="site-nav__burger-label">Meny</span>
      <span class="site-nav__bars" aria-hidden="true"><i></i><i></i><i></i></span>
    </button>
  </nav>

  <div class="nav-overlay" id="meny" hidden>
    <ul class="nav-overlay__list">
      <li><a href="#splash">Hjem</a></li>
      <li><a href="#tjenester">Tjenester</a></li>
      <li><a href="#kontakt">Kontakt</a></li>
      <li><a href="#om">Om meg</a></li>
    </ul>
  </div>
```

- [ ] **Step 4: Write the styles**

Append to `assets/css/style.css`:

```css
/* ---------- fixed navigation ---------- */
.site-nav {
  position: fixed;
  inset: 0 0 auto 0;
  /* Must outrank .nav-overlay (30), or the burger becomes unclickable
     once the menu is open — the first thing anyone tries on a phone. */
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-4);
  pointer-events: none;
  /* difference blending keeps both marks legible over white AND black blocks
     with no scroll listener to fall out of sync */
  mix-blend-mode: difference;
  color: #fff;
}
.site-nav > * { pointer-events: auto; }

.site-nav__logo { display: block; width: 64px; color: #fff; }
.site-nav__logo img { width: 100%; height: auto; }

.site-nav__burger {
  background: none;
  border: 0;
  padding: var(--space-2);
  cursor: pointer;
  color: inherit;
  display: grid;
  gap: var(--space-2);
  justify-items: end;
}
.site-nav__burger-label {
  font-size: 10px;
  font-weight: 300;
  letter-spacing: .18em;
  text-transform: uppercase;
}
.site-nav__bars { display: grid; gap: 5px; }
.site-nav__bars i { display: block; width: 26px; height: 1px; background: currentColor; }

/* ---------- overlay ---------- */
.nav-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: var(--ink);
  display: grid;
  place-items: center;
}
.nav-overlay[hidden] { display: none; }

.nav-overlay__list {
  list-style: none;
  margin: 0;
  padding: 0;
  text-align: center;
}
.nav-overlay__list li + li { margin-top: var(--space-6); }
.nav-overlay__list a {
  color: var(--paper);
  text-decoration: none;
  font-size: clamp(24px, 7vw, 40px);
  font-weight: 200;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.nav-overlay__list a:hover { text-decoration: underline; text-underline-offset: 6px; }

body.nav-open { overflow: hidden; }

html { scroll-behavior: smooth; }
```

- [ ] **Step 5: Write the behaviour**

Append to `assets/js/main.js`:

```js
/* ---------- burger overlay ---------- */
function initNav() {
  const burger = document.querySelector('.site-nav__burger');
  const overlay = document.getElementById('meny');
  if (!burger || !overlay) return;

  const focusables = () =>
    Array.from(overlay.querySelectorAll('a[href], button:not([disabled])'));

  const open = () => {
    overlay.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    focusables()[0]?.focus();
  };

  const close = ({ restoreFocus = true } = {}) => {
    overlay.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (restoreFocus) burger.focus();
  };

  const isOpen = () => !overlay.hidden;

  burger.addEventListener('click', () => (isOpen() ? close() : open()));

  overlay.addEventListener('click', (e) => {
    // a link click, or a click on the backdrop itself
    if (e.target.closest('a') || e.target === overlay) close({ restoreFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;

    if (e.key === 'Escape') { close(); return; }

    if (e.key === 'Tab') {
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
}

initNav();
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd tests && npx playwright test e2e/nav.spec.js
```

Expected: PASS, 5 tests per project.

- [ ] **Step 7: Commit**

```bash
git add index.html assets
git commit -m "feat: add fixed nav and accessible burger overlay"
```

---

## Task 7: Blocks 2 and 4 — Tjenester and Om meg

**Files:**
- Create: `assets/img/tjenester.svg`, `assets/img/om.svg`
- Modify: `index.html`, `assets/css/style.css`
- Test: `tests/e2e/blocks.spec.js`

**Interfaces:**
- Consumes: `.block`, `.block--light`, `.block--dark` from Task 3
- Produces: the reusable `.split` layout (`.split__media` + `.split__body`) used by blocks 2, 3 and 4. Task 8 reuses `.split` with the map in `.split__media`.

- [ ] **Step 1: Create placeholder images**

`assets/img/tjenester.svg` (4:5 portrait):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="#e7e1d8"/>
  <text x="400" y="500" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#8c8175">PLASSHOLDER — tjenester</text>
</svg>
```

`assets/img/om.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="#e3ddd3"/>
  <text x="400" y="500" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#8c8175">PLASSHOLDER — om meg</text>
</svg>
```

- [ ] **Step 2: Write the failing test**

`tests/e2e/blocks.spec.js`:

```js
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
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/blocks.spec.js
```

Expected: FAIL — `#tjenester li` count is 0.

- [ ] **Step 4: Write the markup**

Replace `#tjenester` and `#om` in `index.html`. The copy is Norwegian placeholder text, marked so it is obvious what must be replaced.

```html
    <section id="tjenester" class="block block--light">
      <div class="split">
        <div class="split__media">
          <!-- PLASSHOLDER: se docs/image-spec.md for bytte til ekte foto -->
          <picture>
            <img src="assets/img/tjenester.svg" width="800" height="1000"
                 alt="Plassholderbilde: skredderarbeid" loading="lazy" decoding="async">
          </picture>
        </div>
        <div class="split__body">
          <h2>Tjenester</h2>
          <p>
            Jeg tar imot alt fra enkle reparasjoner til tilpasning av festantrekk.
            Ta gjerne kontakt på telefon, så finner vi ut av hva som trengs.
          </p>
          <ul class="service-list">
            <li>Legging av bukser og skjørt</li>
            <li>Skifte av glidelås</li>
            <li>Tilpasning av kjoler og dresser</li>
            <li>Reparasjon og lapping</li>
            <li>Sying etter mål</li>
          </ul>
        </div>
      </div>
    </section>
```

```html
    <section id="om" class="block block--light">
      <div class="split">
        <div class="split__media">
          <!-- PLASSHOLDER: se docs/image-spec.md -->
          <picture>
            <img src="assets/img/om.svg" width="800" height="1000"
                 alt="Plassholderbilde: portrett av skredderen" loading="lazy" decoding="async">
          </picture>
        </div>
        <div class="split__body">
          <h2>Om meg</h2>
          <p>
            PLASSHOLDER: Jeg heter [NAVN] og har sydd og tilpasset klær i over [ANTALL] år.
            Verkstedet ligger hjemme i Bærum, og jeg tar imot kunder etter avtale.
            Jeg er opptatt av at plaggene dine skal vare lenge, og at de skal sitte som de skal.
          </p>
        </div>
      </div>
    </section>
```

- [ ] **Step 5: Write the styles**

Append to `assets/css/style.css`:

```css
/* ---------- shared two-column layout for blocks 2-4 ---------- */
.split {
  display: grid;
  gap: var(--space-12);
  max-width: 1100px;
  margin: 0 auto;
}

/* Mobile: image first, text second — in every block, deliberately.
   Alternating on a phone reads as inconsistency, not rhythm. */
.split__media { order: 1; }
.split__body  { order: 2; max-width: var(--measure); }

@media (min-width: 800px) {
  .split { grid-template-columns: 1fr 1fr; align-items: center; gap: var(--space-16); }
  .split__media { order: 0; }
  .split__body  { order: 0; }
}

.split__body h2 {
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 300;
  letter-spacing: .04em;
  margin-bottom: var(--space-6);
}

.service-list {
  list-style: none;
  margin: var(--space-8) 0 0;
  padding: 0;
}
.service-list li {
  padding: var(--space-3) 0;
  border-bottom: 1px solid rgba(20, 17, 15, .12);
}
.block--dark .service-list li { border-bottom-color: rgba(253, 252, 250, .18); }
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd tests && npx playwright test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html assets
git commit -m "feat: add services and about blocks with shared split layout"
```

---

## Task 8: Block 3 — Kontakt with click-to-load map

**Files:**
- Modify: `index.html`, `assets/css/style.css`, `assets/js/main.js`
- Test: `tests/e2e/map-consent.spec.js`

**Interfaces:**
- Consumes: `.split` layout from Task 7
- Produces: `.map` containing `button.map__load[data-map-src]`. The iframe is created only on click. **This is the task that implements the legal privacy guarantee — its tests must never be weakened.**

- [ ] **Step 1: Write the failing test**

`tests/e2e/map-consent.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('no Google request and no cookies before the map is clicked', async ({ page, context }) => {
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
  // Spec §3.6: block 3 is the deliberate exception to image-first stacking.
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/map-consent.spec.js
```

Expected: FAIL — `.map__load` does not exist.

- [ ] **Step 3: Write the markup**

Replace `#kontakt` in `index.html`. Note the reversed order: text left, map right on desktop.

```html
    <section id="kontakt" class="block block--dark">
      <div class="split split--reverse">
        <div class="split__body">
          <h2>Kontakt</h2>
          <p class="contact-line">
            <!-- PLASSHOLDER: ekte adresse -->
            [Gateadresse] 00<br>
            1300 Sandvika
          </p>
          <p class="contact-line">
            <a href="tel:+4700998877">00 99 88 77</a><br>
            <a href="mailto:post@hltsom.no">post@hltsom.no</a>
          </p>
          <p class="contact-line">
            <!-- PLASSHOLDER: ekte åpningstider -->
            Man–fre 09–16<br>
            Lørdag etter avtale
          </p>
        </div>
        <div class="split__media">
          <div class="map">
            <button class="map__load" type="button"
                    data-map-src="https://www.google.com/maps?q=Sandvika%2C%20B%C3%A6rum&output=embed">
              <span class="map__load-title">Vis kart</span>
              <span class="map__load-note">Kartet lastes fra Google først når du trykker her.</span>
            </button>
          </div>
        </div>
      </div>
    </section>
```

- [ ] **Step 4: Write the styles**

Append to `assets/css/style.css`:

```css
/* ---------- block 3: contact ---------- */
/* Mobile: text FIRST, map second — the deliberate exception to the
   image-first rule (spec §3.6). The media pane here is a map, not a photo;
   putting it first would bury the phone number behind a grey placeholder.
   Do not "fix" this into consistency with blocks 2 and 4. */
.split--reverse .split__body  { order: 1; }
.split--reverse .split__media { order: 2; }

@media (min-width: 800px) {
  /* Desktop: text left, map right — the inverse of blocks 2 and 4 */
  .split--reverse .split__body  { order: 0; }
  .split--reverse .split__media { order: 1; }
}

.contact-line { margin: 0 0 var(--space-6); }
.contact-line a { text-decoration: none; border-bottom: 1px solid rgba(253, 252, 250, .35); }
.contact-line a:hover { border-bottom-color: currentColor; }

.map { aspect-ratio: 4 / 3; background: rgba(253, 252, 250, .06); }

.map__load {
  width: 100%; height: 100%;
  display: grid; place-content: center; gap: var(--space-3);
  padding: var(--space-8);
  background: none;
  border: 1px solid rgba(253, 252, 250, .28);
  color: var(--paper);
  font: inherit;
  text-align: center;
  cursor: pointer;
}
.map__load:hover { background: rgba(253, 252, 250, .06); }
.map__load-title { font-size: 18px; letter-spacing: .1em; text-transform: uppercase; font-weight: 300; }
.map__load-note { font-size: 13px; opacity: .7; max-width: 34ch; margin: 0 auto; }

.map iframe { width: 100%; height: 100%; border: 0; }
```

- [ ] **Step 5: Write the behaviour**

Append to `assets/js/main.js`:

```js
/* ---------- click-to-load map ----------
   The iframe must NOT exist until the visitor asks for it. Creating it on load
   would let Google set cookies without consent, which is a legal problem, not a
   performance one. Do not "optimise" this by preloading. */
function initMap() {
  const button = document.querySelector('.map__load');
  if (!button) return;

  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = button.dataset.mapSrc;
    iframe.title = 'Kart som viser hvor HLT Søm holder til';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
  });
}

initMap();
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd tests && npx playwright test e2e/map-consent.spec.js
```

Expected: PASS, 3 tests per project.

- [ ] **Step 7: Commit**

```bash
git add index.html assets
git commit -m "feat: add contact block with consent-gated map"
```

---

## Task 9: Footer

**Files:**
- Modify: `index.html`, `assets/css/style.css`
- Test: `tests/e2e/footer.spec.js`

**Interfaces:**
- Consumes: `--ink`, `--paper` tokens
- Produces: `footer.site-footer`

- [ ] **Step 1: Write the failing test**

`tests/e2e/footer.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('footer is dark, centred, and holds org number, email and phone', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer).toHaveCSS('text-align', 'center');
  await expect(footer).toContainText('Organisasjonsnummer');
  await expect(footer).toContainText('E-post');
  await expect(footer).toContainText('Telefon');
  await expect(footer).toHaveCSS('background-color', 'rgb(20, 17, 15)');
});

test('footer contrasts with the block above it', async ({ page }) => {
  await page.goto('/');
  const above = await page.locator('#om').evaluate((el) => getComputedStyle(el).backgroundColor);
  const footer = await page.locator('.site-footer').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(above).not.toBe(footer);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/footer.spec.js
```

Expected: FAIL — `.site-footer` does not exist.

- [ ] **Step 3: Write the markup**

Insert after `</main>` in `index.html`:

```html
  <footer class="site-footer">
    <p>
      <!-- PLASSHOLDER: ekte organisasjonsnummer, e-post og telefon -->
      Organisasjonsnummer: 000 000 000
      <span aria-hidden="true">|</span>
      E-post: <a href="mailto:post@hltsom.no">post@hltsom.no</a>
      <span aria-hidden="true">|</span>
      Telefon: <a href="tel:+4700998877">00 99 88 77</a>
    </p>
  </footer>
```

- [ ] **Step 4: Write the styles**

```css
/* ---------- footer ---------- */
.site-footer {
  background: var(--ink);
  color: var(--paper);
  text-align: center;
  padding: var(--space-12) var(--space-6);
  font-size: 14px;
  font-weight: 300;
}
.site-footer p { margin: 0; line-height: 2; }
.site-footer a { text-decoration: none; border-bottom: 1px solid rgba(253, 252, 250, .35); }
.site-footer span { padding: 0 var(--space-2); opacity: .4; }
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd tests && npx playwright test e2e/footer.spec.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html assets/css/style.css
git commit -m "feat: add footer with business details"
```

---

## Task 10: Parallax and reduced motion

**Files:**
- Modify: `assets/css/style.css`
- Test: `tests/e2e/motion.spec.js`

**Interfaces:**
- Consumes: `--parallax-factor` from Task 3, block sections from Tasks 4–7
- Produces: no new selectors — adds `@supports (animation-timeline: view())` rules and a global `@media (prefers-reduced-motion: reduce)` override block.

- [ ] **Step 1: Write the failing test**

`tests/e2e/motion.spec.js`:

```js
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

test('the page still scrolls to every block', async ({ page }) => {
  await page.goto('/');
  for (const id of ['#tjenester', '#kontakt', '#om']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await expect(page.locator(id)).toBeInViewport();
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/motion.spec.js
```

Expected: FAIL — the CSS contains no `animation-timeline`.

- [ ] **Step 3: Write the parallax**

Append to `assets/css/style.css`:

```css
/* ---------- parallax ----------
   Outgoing block travels at half scroll speed; the incoming block moves normally,
   so it appears to slide over the one leaving. Runs on the compositor via
   scroll-driven animations — no scroll listener, no jank on mid-range phones.
   Browsers without support simply scroll normally, which is a complete page. */
@supports (animation-timeline: view()) {
  @keyframes parallax-exit {
    /* only the exit half of the range is animated; entry stays at 1x */
    from { transform: translateY(0); }
    to   { transform: translateY(calc(-50% * var(--parallax-factor))); }
  }

  @media (min-width: 800px) {
    #tjenester, #kontakt, #om {
      animation: parallax-exit linear both;
      animation-timeline: view();
      animation-range: exit-crossing 0% exit 100%;
      will-change: transform;
    }
  }
}

/* ---------- reduced motion ----------
   A calm page, not a broken one. */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }

  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    animation-name: none !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }

  .splash__slide { transition: none; }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd tests && npx playwright test e2e/motion.spec.js
```

Expected: PASS, 5 tests per project.

- [ ] **Step 5: Verify the effect by eye**

Open the site, scroll slowly through all four blocks. The outgoing block should visibly lag. Then enable reduced motion at the OS level and confirm everything goes still.

- [ ] **Step 6: Commit**

```bash
git add assets/css/style.css
git commit -m "feat: add scroll-driven parallax with reduced-motion fallback"
```

---

## Task 11: SEO, structured data and security headers

**Files:**
- Create: `robots.txt`, `sitemap.xml`
- Modify: `index.html`
- Test: `tests/e2e/seo.spec.js`

**Interfaces:**
- Consumes: the finished markup from Tasks 4–9
- Produces: `LocalBusiness` JSON-LD, Open Graph tags, canonical link, CSP meta tag, `robots.txt`, `sitemap.xml`. The canonical origin is `https://bengalack.github.io/hltsom/` until the domain moves (Task 12 of the spec's §14 checklist).

- [ ] **Step 1: Write the failing test**

`tests/e2e/seo.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('has canonical, description and Open Graph tags', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /hltsom/);
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc.length).toBeGreaterThan(70);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'nb_NO');
});

test('LocalBusiness structured data is valid JSON with the required fields', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').innerText();
  const data = JSON.parse(raw);
  expect(data['@type']).toBe('LocalBusiness');
  expect(data.name).toBe('HLT Søm');
  expect(data.telephone).toBeTruthy();
  expect(data.address['@type']).toBe('PostalAddress');
  expect(data.address.addressCountry).toBe('NO');
  expect(data.areaServed.length).toBeGreaterThan(0);
});

test('has a Content-Security-Policy meta tag restricting sources', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("frame-src https://www.google.com");
  expect(csp).not.toContain("'unsafe-eval'");
});

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<urlset');
});

test('heading order is sane: one h1, then h2s', async ({ page }) => {
  await page.goto('/');
  const levels = await page.locator('h1, h2, h3').evaluateAll((els) =>
    els.map((e) => Number(e.tagName[1]))
  );
  expect(levels[0]).toBe(1);
  expect(levels.filter((l) => l === 1)).toHaveLength(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd tests && npx playwright test e2e/seo.spec.js
```

Expected: FAIL — no canonical link, no JSON-LD.

- [ ] **Step 3: Extend `<head>` in `index.html`**

```html
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    img-src 'self' data:;
    style-src 'self';
    font-src 'self';
    script-src 'self' https://static.cloudflareinsights.com;
    connect-src https://cloudflareinsights.com;
    frame-src https://www.google.com;
    base-uri 'none';
    form-action 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">

  <link rel="canonical" href="https://bengalack.github.io/hltsom/">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="nb_NO">
  <meta property="og:title" content="HLT Søm — skredder i Bærum">
  <meta property="og:description" content="Lokal skredder i Bærum. Legging av bukser, skifte av glidelås, tilpasning og reparasjon av klær.">
  <meta property="og:url" content="https://bengalack.github.io/hltsom/">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "HLT Søm",
    "description": "Skredder i Bærum. Legging av bukser, skifte av glidelås, tilpasning og reparasjon av klær.",
    "url": "https://bengalack.github.io/hltsom/",
    "telephone": "+4700998877",
    "email": "post@hltsom.no",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "[Gateadresse] 00",
      "postalCode": "1300",
      "addressLocality": "Sandvika",
      "addressCountry": "NO"
    },
    "areaServed": ["Bærum", "Oslo"],
    "openingHours": "Mo-Fr 09:00-16:00"
  }
  </script>
```

> The JSON-LD values marked `[…]` are placeholders and must be replaced together with the visible copy. Search engines penalise a mismatch between structured data and the page, so update both at once.

- [ ] **Step 4: Add the analytics snippet, commented out**

Immediately before `</body>`, after the `main.js` tag. It stays commented until the Cloudflare account exists (spec §13) — an invalid token would just produce 404s.

```html
  <!-- Cloudflare Web Analytics — cookieless, no consent banner needed.
       Uncomment and paste the real token once the free Cloudflare account exists.
       See docs/superpowers/specs/2026-09-09-hltsom-website-design.md §13.
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "REPLACE_WITH_TOKEN"}'></script>
  -->
```

- [ ] **Step 5: Create `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://bengalack.github.io/hltsom/sitemap.xml
```

- [ ] **Step 6: Create `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bengalack.github.io/hltsom/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
cd tests && npx playwright test
```

Expected: PASS, the full suite.

- [ ] **Step 8: Commit**

```bash
git add index.html robots.txt sitemap.xml
git commit -m "feat: add structured data, Open Graph, CSP and crawl directives"
```

---

## Task 12: Final verification and deployment

**Files:**
- Modify: none expected; fix whatever verification surfaces
- Test: `tests/e2e/nojs.spec.js`

**Interfaces:**
- Consumes: everything
- Produces: a deployed site at `https://bengalack.github.io/hltsom/`

- [ ] **Step 1: Write the no-JavaScript test**

The page must stay readable and the phone number tappable with JS disabled — this is the failure mode where a visitor gets a blank screen and calls nobody.

`tests/e2e/nojs.spec.js`:

```js
import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('page is fully readable without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.splash__mark')).toBeVisible();
  await expect(page.locator('#tjenester')).toContainText('Legging av bukser');
  await expect(page.locator('#kontakt a[href^="tel:"]')).toBeVisible();
  await expect(page.locator('.site-footer')).toContainText('Telefon');
});

test('first carousel image still shows without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.splash__slide').first()).toHaveClass(/is-active/);
});
```

- [ ] **Step 2: Run the full suite**

```bash
cd tests && npx playwright test
```

Expected: PASS, every spec, both projects. Fix anything that fails before continuing.

- [ ] **Step 3: Run Lighthouse against the thresholds**

```bash
npx serve . -l 5173
# in another terminal:
npx --yes lighthouse http://localhost:5173 --preset=desktop --view
npx --yes lighthouse http://localhost:5173 --form-factor=mobile --view
```

Required (spec §11.2): Performance **≥ 90**, Accessibility **100**, Best Practices **≥ 95**, SEO **100**.
If Accessibility is below 100, fix it — there is no acceptable excuse at this size of page.

- [ ] **Step 4: Manual checks**

- [ ] Open on a real phone, not a resized desktop window. Confirm the splash fills the screen with no gap when the address bar collapses.
- [ ] Keyboard only: Tab to the burger, Enter to open, Tab through the links, Escape to close, confirm focus returns to the burger.
- [ ] Enable "reduce motion" in the OS. Confirm the carousel holds, the parallax stops, and anchor jumps are instant.
- [ ] Open devtools → Application → Cookies. Confirm **zero cookies** before clicking "Vis kart", and that clicking it loads the map.
- [ ] Confirm the wordmark is legible over every carousel image.
- [ ] Paste the page source into <https://search.google.com/test/rich-results> and confirm the `LocalBusiness` block validates.

- [ ] **Step 5: Enable GitHub Pages**

In the repository: Settings → Pages → Source: **Deploy from a branch** → Branch `main`, folder `/ (root)`. Save. Wait for the first deploy, then open `https://bengalack.github.io/hltsom/` and confirm CSS, fonts and images all load — a 404 here almost always means a root-absolute path slipped in.

- [ ] **Step 6: Commit and push**

```bash
git add tests
git commit -m "test: verify the page works without JavaScript"
git push origin main
```

- [ ] **Step 7: Update the spec status**

Change the `Status:` line at the top of `docs/superpowers/specs/2026-09-09-hltsom-website-design.md` to `Implemented — placeholder content and imagery pending` and commit.

---

## Not in this plan

These are tracked in spec §13 (Open items) and §14 (Domain switch-over), and are deliberately out of scope because they depend on things that do not exist yet:

- **Real photography, logo and copy.** Everything ships as marked placeholders. `docs/image-spec.md` makes the swap mechanical.
- **Responsive `<picture>` sources.** AVIF/WebP `<source>` lines cannot be written before real photos exist; the `<picture>` wrappers are already in place so adding them is a one-line insert.
- **Cloudflare Web Analytics activation.** The snippet is committed, commented, awaiting a token.
- **The `hltsom.no` move.** Spec §14 holds the exact checklist. The domain is not registered yet.
- **Google Business Profile.** Outside this repo, and probably the highest-impact SEO action available.
