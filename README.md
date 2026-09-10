# HLT Søm

One-page website for HLT Søm, a tailoring business in Bærum, Norway.

## Layout

```
docs/            the website — THE ONLY FOLDER EVER SERVED
documentation/   the spec, the ADRs and the image spec
tests/           Playwright suite (developer tooling, never deployed)
tools/           how to prepare images (never deployed)
```

`docs/` holds the site and `documentation/` holds the writing about it. The naming is awkward
and deliberate: `docs/` is the only subfolder GitHub Pages will serve from a branch, so putting
the site there is what keeps everything else out of reach of a browser — with no build step and
no deploy workflow to maintain.

## Working on it

There is no build step. Serve the site folder:

```bash
npx serve docs -l 5173
```

Serve `docs`, not the repository root — that is what a host does, and it is the only way to be
sure nothing outside the site is reachable.

## Tests

```bash
cd tests && npm install && npx playwright install chromium && npx playwright test
```

The suite serves `docs/` exactly as a host would, so it also checks that `documentation/`,
`tests/` and `tools/` cannot be requested over HTTP.

## Deploying

**GitHub Pages** — Settings → Pages → Deploy from a branch → `main`, folder **`/docs`**.
Note that Pages from a *private* repository requires GitHub Pro or above; on the free plan the
repository has to be public. (GitHub Pro is the account plan — Copilot Pro is a different
product and does not enable this.)

**Cloudflare Pages** — connect the repository, leave the build command empty, set the output
directory to `docs`. Works with a private repository on the free plan.

**Netlify** — same shape: no build command, publish directory `docs`.

Nothing here is host-specific, so moving between them is a settings change rather than a code
change.

## Before you change anything

Read `CLAUDE.md`, then `documentation/superpowers/specs/2026-09-09-hltsom-website-design.md`.
Several things that look like mistakes are deliberate and documented there.
