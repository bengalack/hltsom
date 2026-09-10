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
4. **No cookies before consent.** The contact block shows a static OpenStreetMap image served
   from this origin. Nothing reaches Google until the visitor clicks it, and that click is the
   consent action — which is why the site needs no cookie banner. Do NOT load the Google iframe
   on page load or on scroll; that would be a legal problem, not a performance one. See
   `docs/decisions/0002-static-map-preview.md` (which supersedes 0001).
   **The OpenStreetMap credit under the preview is required by the ODbL licence — do not
   remove it from the preview.** It is HIDDEN (`visibility: hidden`, never removed, never
   `display: none`) once the visitor clicks and Google's map takes over, because the credit
   then describes tiles that are no longer on screen. Hiding rather than removing keeps its box,
   so the page does not resettle under the visitor's finger. All of it is tested.
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
- **Parallax is JavaScript, and must stay keyed to document coordinates only.** Never
  reintroduce `innerHeight`, `clientHeight`, `visualViewport` or `getBoundingClientRect` into
  `initParallax` — a test forbids each by name. CSS scroll-driven animations look like the
  better tool and are how this was first built; they measure against the scrollport, which
  mobile browsers resize mid-drag, which made blocks jump 58px on a real phone. See
  `docs/decisions/0004-parallax-in-javascript.md` (supersedes 0003).
- **`html` carries `background: var(--ink)`, `body` carries `--paper`.** That is not a
  duplication to clean up. The root's background paints the canvas revealed when a phone
  rubber-bands past the top or bottom; without it, overscroll shows a white band below the dark
  footer. Once `html` has a background, `body`'s no longer propagates to the canvas, which is
  the point.
- **In-page links scroll to `offsetTop` from JavaScript, not via the browser's anchor jump.**
  Browsers resolve anchors against the *rendered* position, which the parallax has displaced, so
  a plain `href="#splash"` lands short and needs repeated clicks. Do not "simplify" this back to
  plain anchors.
- **Blocks carry explicit `z-index: 1..4`, the footer `5`.** With JavaScript only the moving
  block has a transform, so without these an exiting block paints over the one arriving.
- **The footer never parallaxes, and carries `position: relative; z-index: 1`.** It is shorter
  than the viewport so there is no exit phase to animate, and the z-index is what stops the
  lagging last block sliding over it (57px on a phone). It must stay static while scrolling.
- **The parallax runs at full strength on all four blocks, and must stay that way.** Freezing
  the last block to hold the footer was tried and reverted by the owner: it removed the effect
  from a quarter of the page. Block 4 drifting from the footer is an accepted cost (spec §5.2).
- **The big bottom padding on `.block` is runway for the parallax, not decoration.** The lag
  pushes content down into it and the arriving block eats it; without it, a lagging block buries
  the next screen of text — the services list was unreadable on a real phone. `--parallax-runway`
  is the knob: raise it and the effect strengthens, lower it and the effect weakens. Never trim
  the padding as "unused whitespace". See spec §5.1.
- **The lag is linear to a knee, then eases into the runway.** Two simpler shapes were tried and
  both were reported as defects: `Math.min` snaps from half speed to normal in one frame (speed
  step 0.28), and easing from the first pixel never holds the target speed at all. Tests bound
  the step below 0.1 AND require 300px+ held at target, so both failures fail the suite.
- **Half speed lasts exactly 2 x runway pixels of scrolling.** If it should last longer, raise
  `--parallax-runway` — there is no curve that avoids this trade, because the next block arrives
  on a schedule fixed by layout.
- **Mobile's runway is 700px against desktop's 240px, and that gap is deliberate.** Mobile blocks
  are twice as tall because the image and text stack, so the same runway would be spent in the
  first 40% of the block. The large mobile whitespace is what the effect runs on — it is not
  padding someone forgot to tune down. See spec §5.1 for the measured parity table.
- **The parallax offset is POSITIVE.** It looks inverted and is not: a block has to lag the
  page to appear slower. A negative value drags it along with the scroll and it leaves *faster*
  than normal — measured at -1.17x, which reads as "the parallax is broken". A test measures
  effective scroll speed rather than trusting the code.
- **`.site-nav__burger-label` has `margin-right: -.18em`.** Not dead code: letter-spacing is
  applied after the last letter too, so "MENY" would sit visibly off-centre above the bars
  without it.
- **`logo.svg` uses an explicit `#ffffff` and Georgia**, not `currentColor` and not the site
  webfont. An SVG loaded through an `<img>` can do neither. See `docs/image-spec.md`.
- **Block images are square sources in a circular crop.** A 4:5 photo will have its corners
  thrown away. Supply squares with the subject centred.

## How to change a decision

- Ordinary iteration (content, wording, spacing, timings, a new service, a swapped photo):
  edit the spec in place. No ceremony.
- Reversing a decision above, or adding a lasting constraint: write an ADR in
  `docs/decisions/`, then edit the spec to match and link the ADR.

## Testing

```bash
cd tests && npm install && npx playwright install chromium && npx playwright test
```

The suite guards the constraints above — no cookies before consent, focus handling, reduced motion,
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
