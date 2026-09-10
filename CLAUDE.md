# HLT Søm — working agreement

One-page website for a tailoring business in Bærum, Norway.

## Where things live

- **`docs/` is the website, and the only folder ever served.** Its naming is awkward on purpose:
  `docs/` is the sole subfolder GitHub Pages will serve from a branch, so putting the site there
  is what keeps everything else unreachable from a browser — with no build step and no deploy
  workflow. Do not "tidy" the site back to the repository root; that would publish the working
  notes along with it.
- **`documentation/` is the writing about the site** — spec, ADRs, image spec. Never served.
- `tests/` and `tools/` are also outside the document root.

Serve `docs`, not the repository root, when running locally:

```bash
npx serve docs -l 5173
```

Tests assert that `docs/` contains only site files and that `documentation/`, `tests/`, `tools/`,
`CLAUDE.md` and `README.md` all return an error over HTTP.

**Before changing anything, read:**

1. `documentation/superpowers/specs/2026-09-09-hltsom-website-design.md` — the living design spec
2. `documentation/decisions/` — ADRs recording anything that later reversed the spec

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
   `documentation/decisions/0002-static-map-preview.md` (which supersedes 0001).
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
  the photography changes substantially, re-derive them — `documentation/image-spec.md` explains how.
- **Parallax is JavaScript, and must stay keyed to document coordinates only.** Never
  reintroduce `innerHeight`, `clientHeight`, `visualViewport` or `getBoundingClientRect` into
  `initParallax` — a test forbids each by name. CSS scroll-driven animations look like the
  better tool and are how this was first built; they measure against the scrollport, which
  mobile browsers resize mid-drag, which made blocks jump 58px on a real phone. See
  `documentation/decisions/0004-parallax-in-javascript.md` (supersedes 0003).
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
- **The footer never parallaxes.** It is shorter than the viewport, so there is no exit phase to
  animate, and its `z-index: 5` is what stops the lagging last block sliding over it (57px on a
  phone). It must stay static while scrolling — a test asserts it holds one document position.
- **The parallax runs at full strength on all four blocks, and must stay that way.** Freezing
  the last block to hold the footer was tried and reverted by the owner: it removed the effect
  from a quarter of the page. Block 4 drifting from the footer is an accepted cost (spec §5.2).
- **Blocks overlapping and covering each other's text is the EFFECT, not a bug.** Do not add a
  cap, an ease, or an exclusion to prevent it — three such attempts were made and all three were
  rejected for gutting the parallax. Blocks run at exactly -0.5x for their whole exit.
- **The bottom padding on `.block` is runway, not decoration.** It controls WHEN the arriving
  block reaches the previous one's text: covering begins 2 x runway pixels into a block. Too
  early and the text is unreadable (the original complaint, at ~15%); partway through is fine.
  `--parallax-runway` is the knob, and it changes the timing, never the speed. See spec §5.1.
- **The lag is linear and uncapped.** `Math.min` and easing curves were both tried and both were
  reported as defects — a clamp snaps from half speed to normal in one frame (speed step 0.28),
  and easing never holds the target at all. Tests require >90% of each block held at target and
  bound the speed step below 0.1.
- **The parallax offset is POSITIVE.** It looks inverted and is not: a block has to lag the
  page to appear slower. A negative value drags it along with the scroll and it leaves *faster*
  than normal — measured at -1.17x, which reads as "the parallax is broken". A test measures
  effective scroll speed rather than trusting the code.
- **`.site-nav__burger-label` has `margin-right: -.18em`.** Not dead code: letter-spacing is
  applied after the last letter too, so "MENY" would sit visibly off-centre above the bars
  without it.
- **`logo.svg` uses an explicit `#ffffff` and Georgia**, not `currentColor` and not the site
  webfont. An SVG loaded through an `<img>` can do neither. See `documentation/image-spec.md`.
- **Block images are square sources in a circular crop.** A 4:5 photo will have its corners
  thrown away. Supply squares with the subject centred.

## How to change a decision

- Ordinary iteration (content, wording, spacing, timings, a new service, a swapped photo):
  edit the spec in place. No ceremony.
- Reversing a decision above, or adding a lasting constraint: write an ADR in
  `documentation/decisions/`, then edit the spec to match and link the ADR.

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
