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
  for (const p of [
    'docs/decisions/README.md',
    'docs/image-spec.md',
    'tools/optimize-images.md',
    'README.md',
  ]) {
    expect(existsSync(resolve(repoRoot, p))).toBe(true);
  }
});
