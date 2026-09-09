# HLT Søm — working agreement

One-page website for a tailoring business in Bærum, Norway.

**Before changing anything, read:**

1. `docs/superpowers/specs/2026-09-09-hltsom-website-design.md` — the living design spec
2. `docs/decisions/` — ADRs recording anything that later reversed the spec

## Load-bearing constraints

These look like things worth "fixing". They are not. Each was decided deliberately, and the
spec records why.

1. **No build step, no dependencies for the site.** No `package.json` at the repo root.
   `index.html`, the CSS and the JS are served exactly as committed. `tests/` has its own
   `package.json` — that is developer tooling, never deployed, and deletable.
2. **No visible header.** The floating logo and burger *are* the navigation, on purpose.
3. **Norwegian bokmål only.** No English, no language switcher.
4. **The map loads automatically, but must stay deferred.** It is inserted by an
   IntersectionObserver as the contact block nears the viewport — NOT on page load, and NOT on
   a click. `loading="lazy"` alone was measured and does not defer it (Chromium fetched Google
   at ~60ms). See ADR `docs/decisions/0001-map-loads-without-click.md`.
   **Consequence: Google sets cookies without consent, so this site needs a consent mechanism
   before launch.** That is an open item, not a solved problem.
5. **Relative asset paths only** (`assets/…`, never `/assets/…`). The site moves from a
   GitHub Pages subpath to an apex domain; root-absolute paths break silently on one of them.
6. **No Google Fonts CDN.** Fonts are self-hosted in `assets/fonts/`. Loading them from
   Google sends visitor IPs to Google, which is a GDPR problem in the EU.

## Things that look like bugs but are not

- **Block 3 (Kontakt) stacks text-first on mobile** while blocks 2 and 4 stack image-first.
  Block 3's media pane is the map; image-first would bury the phone number behind a grey
  placeholder. See spec §3.6.
- **`.site-nav` has a higher `z-index` than `.nav-overlay`.** That is what keeps the burger
  clickable while the menu is open.
- **The menu is a full-screen takeover on phones but a small dropdown on desktop.** Same DOM,
  same JavaScript; the difference is entirely CSS, and it is intentional. Scroll-lock applies
  to the takeover only.
- **Only `splash-1.jpg` has a `src` in the markup.** Slides 2–4 carry `data-src` and are filled
  in by `main.js` after load, keeping ~900KB off the critical path. Giving them all a plain
  `src` will fail a test.
- **The colour tokens are derived from the carousel photographs**, not picked independently. If
  the photography changes substantially, re-derive them — `docs/image-spec.md` explains how.

## How to change a decision

- Ordinary iteration (content, wording, spacing, timings, a new service, a swapped photo):
  edit the spec in place. No ceremony.
- Reversing a decision above, or adding a lasting constraint: write an ADR in
  `docs/decisions/`, then edit the spec to match and link the ADR.

## Testing

```bash
cd tests && npm install && npx playwright install chromium && npx playwright test
```

The suite guards the constraints above — map deferral, focus handling, reduced motion,
relative paths, and the absence of a root `package.json`. If one fails, the constraint was
broken; fix the code, not the test.

## Pre-launch: the site is intentionally not indexable

`index.html` carries `<meta name="robots" content="noindex, nofollow">` while placeholder
content remains, so fake contact details never reach a search index. `robots.txt` still allows
crawling on purpose — a blocked crawler cannot read the noindex tag, which would make it
useless. Do not add `Disallow: /`.

`tests/e2e/prelaunch.spec.js` binds the tag to the placeholders in both directions, so neither
"published fake data" nor "forgot to remove noindex on launch day" can pass silently.

Lighthouse will not score SEO 100 while the tag is present. That is correct. Do not remove the
tag to raise the score. See spec §9.1.
