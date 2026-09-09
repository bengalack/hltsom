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
  const html = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
  const offenders = [...html.matchAll(/(?:src|href)="(\/[^/][^"]*)"/g)].map((m) => m[1]);
  expect(offenders).toEqual([]);
});
