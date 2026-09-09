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

test('CLAUDE.md states the load-bearing constraints', () => {
  const md = read('CLAUDE.md').toLowerCase();
  for (const needle of [
    'no build step',
    'no visible header',
    'norwegian',
    'before consent',      // the map's consent rule must stay visible
    'relative',
    'google fonts',
  ]) {
    expect(md, `CLAUDE.md should mention "${needle}"`).toContain(needle);
  }
});

test('CLAUDE.md points at the current map ADR, not a superseded rule', () => {
  // The map decision flipped twice. A future agent reading only CLAUDE.md must
  // be told the live rule, never one that has since been reversed.
  const md = read('CLAUDE.md');
  expect(md).toContain('0002-static-map-preview.md');
  expect(md.toLowerCase()).not.toContain('must not enter the dom until');
  expect(md.toLowerCase()).not.toContain('loads automatically, but must stay deferred');
});

test('CLAUDE.md preserves the OpenStreetMap attribution requirement', () => {
  // Removing the attribution is a licence violation, not a tidy-up.
  expect(read('CLAUDE.md')).toContain('ODbL');
});

test('supporting docs exist', () => {
  for (const p of [
    'docs/decisions/README.md',
    'docs/image-spec.md',
    'tools/optimize-images.md',
    'README.md',
  ]) {
    expect(existsSync(resolve(repoRoot, p))).toBe(true);
  }
});
