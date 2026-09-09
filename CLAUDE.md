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
4. **No cookies before consent.** The Google Map must not enter the DOM until the visitor
   clicks "Vis kart". This is a legal requirement, not a performance trick. Do not preload it.
5. **Relative asset paths only** (`assets/…`, never `/assets/…`). The site moves from a
   GitHub Pages subpath to an apex domain; root-absolute paths break silently on one of them.
6. **No Google Fonts CDN.** Fonts are self-hosted in `assets/fonts/`. Loading them from
   Google sends visitor IPs to Google, which is a GDPR problem in the EU.

## Two things that look like bugs but are not

- **Block 3 (Kontakt) stacks text-first on mobile** while blocks 2 and 4 stack image-first.
  Block 3's media pane is the map; image-first would bury the phone number behind a grey
  placeholder. See spec §3.6.
- **`.site-nav` has a higher `z-index` than `.nav-overlay`.** That is what keeps the burger
  clickable while the menu is open.

## How to change a decision

- Ordinary iteration (content, wording, spacing, timings, a new service, a swapped photo):
  edit the spec in place. No ceremony.
- Reversing a decision above, or adding a lasting constraint: write an ADR in
  `docs/decisions/`, then edit the spec to match and link the ADR.

## Testing

```bash
cd tests && npm install && npx playwright install chromium && npx playwright test
```

The suite guards the constraints above — consent-gated map, focus handling, reduced motion,
relative paths, and the absence of a root `package.json`. If one fails, the constraint was
broken; fix the code, not the test.
