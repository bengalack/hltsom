import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = () => readFileSync(resolve(repoRoot, 'docs/index.html'), 'utf8');

/* Markers that mean the page still carries invented content. Fake contact
   details reaching a search index is worse than not being indexed at all:
   wrong NAP data is hard to correct and poisons the Google Business Profile
   match later. */
const PLACEHOLDER_MARKERS = [
  'PLASSHOLDER',
  '[Gateadresse]',
  '[NAVN]',
  '[ANTALL]',
  '000 000 000',
  '+4700998877',
];

const remainingPlaceholders = () => {
  const source = html();
  return PLACEHOLDER_MARKERS.filter((m) => source.includes(m));
};

const hasNoindex = () => /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html());

test('placeholders and the noindex tag stay in step', () => {
  // Binds the two together in both directions, so neither can be forgotten:
  //   placeholders present  -> noindex MUST be present
  //   placeholders all gone -> noindex MUST be removed
  const left = remainingPlaceholders();

  if (left.length > 0) {
    expect(
      hasNoindex(),
      `index.html still contains placeholders (${left.join(', ')}), so the ` +
        'noindex meta tag must stay. Do not publish invented contact details.'
    ).toBe(true);
  } else {
    expect(
      hasNoindex(),
      'All placeholders are gone, so this page is ready for search. Remove the ' +
        '<meta name="robots" content="noindex, nofollow"> tag from index.html.'
    ).toBe(false);
  }
});

test('robots.txt never uses Disallow while the page relies on noindex', () => {
  // A crawler blocked by robots.txt cannot read the noindex tag, so the two
  // together are weaker than noindex alone.
  const robots = readFileSync(resolve(repoRoot, 'docs/robots.txt'), 'utf8');
  if (hasNoindex()) {
    expect(robots).not.toMatch(/^\s*Disallow:\s*\/\s*$/m);
  }
});

test('no sitemap is advertised while the site is noindexed', () => {
  const robots = readFileSync(resolve(repoRoot, 'docs/robots.txt'), 'utf8');
  if (hasNoindex()) {
    expect(robots).not.toMatch(/^\s*Sitemap:/m);
  }
});
