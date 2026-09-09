# HLT Søm

One-page website for HLT Søm, a tailoring business in Bærum, Norway.

Live: <https://bengalack.github.io/hltsom/> — moving to <https://hltsom.no> once the domain is
registered (checklist in the spec, §14).

## Working on it

There is no build step. Open `index.html` in a browser, or serve the folder:

```bash
npx serve . -l 5173
```

The whole site is three files: `index.html`, `assets/css/style.css`, `assets/js/main.js`.

## Tests

```bash
cd tests && npm install && npx playwright install chromium && npx playwright test
```

`tests/` is developer tooling with its own `package.json`. It is never deployed, and the site
does not depend on it.

## Deploying

Push to `main`. GitHub Pages serves the repository root.

## Before you change anything

Read `CLAUDE.md`, then `docs/superpowers/specs/2026-09-09-hltsom-website-design.md`. Several
things that look like mistakes are deliberate and documented there.
