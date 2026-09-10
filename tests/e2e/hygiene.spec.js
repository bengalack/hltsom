import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('no package.json at the repository root', () => {
  // The site must stay zero-dependency. tests/package.json is the sole exception.
  expect(existsSync(resolve(repoRoot, 'package.json'))).toBe(false);
});

test('no root-absolute asset paths in index.html', () => {
  // The site runs at a GitHub Pages subpath today and at an apex domain later.
  // A root-absolute path works in exactly one of those and breaks silently in the other.
  const html = readFileSync(resolve(repoRoot, 'docs/index.html'), 'utf8');
  const offenders = [...html.matchAll(/(?:src|href)="(\/[^/][^"]*)"/g)].map((m) => m[1]);
  expect(offenders).toEqual([]);
});

test('the published folder contains only the site', async () => {
  /* Requirement: a visitor arriving in a browser must reach the site and
     nothing else. Hosting serves docs/ alone, so the working notes, the tests
     and the image tooling are not merely unlinked — they are outside the
     document root and cannot be requested at all.

     If something new belongs to the site, add it here. If it does not belong to
     the site, it does not belong in docs/. */
  const allowed = new Set([
    '.nojekyll',      // tells GitHub Pages to serve files verbatim
    'assets',
    'index.html',
    'robots.txt',
    'sitemap.xml',
    'CNAME',          // added at the domain switch-over, not present yet
  ]);

  const { readdirSync } = await import('node:fs');
  const entries = readdirSync(resolve(repoRoot, 'docs'));
  const unexpected = entries.filter((e) => !allowed.has(e));
  expect(unexpected,
    `docs/ is the document root — these would be publicly reachable: ${unexpected.join(', ')}`
  ).toEqual([]);
});

test('the working notes are not reachable from the browser', async ({ request }) => {
  // documentation/, tests/ and tools/ live outside the document root.
  for (const path of [
    '/documentation/superpowers/specs/2026-09-09-hltsom-website-design.md',
    '/documentation/decisions/0004-parallax-in-javascript.md',
    '/documentation/image-spec.md',
    '/tests/package.json',
    '/tools/optimize-images.md',
    '/CLAUDE.md',
    '/README.md',
  ]) {
    const res = await request.get(path, { failOnStatusCode: false });
    expect(res.status(), `${path} is reachable from a browser`).toBeGreaterThanOrEqual(400);
  }
});

test('the site itself is still served', async ({ request }) => {
  // the mirror of the test above: docs/ IS the root, so these resolve
  for (const path of ['/', '/robots.txt', '/sitemap.xml', '/assets/css/style.css']) {
    const res = await request.get(path);
    expect(res.status(), `${path} should be served`).toBe(200);
  }
});
