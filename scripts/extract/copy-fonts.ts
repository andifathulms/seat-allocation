/**
 * Copies the two self-hosted font files into public/fonts.
 *
 * CLAUDE.md forbids a CDN, so the faces are served from the app's own origin.
 * The files come from the @fontsource-variable packages, which are kept as
 * devDependencies purely so this copy is reproducible and the provenance of the
 * binaries is recorded rather than assumed.
 *
 * Only the latin subset ships. Indonesian needs nothing above U+00FF, and the
 * two non-ASCII strings in the interface — Sainte-Laguë and Laakso–Taagepera —
 * are both inside it.
 *
 *   npm run fonts:build
 */

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(root, 'public/fonts');
mkdirSync(out, { recursive: true });

const files: Array<[string, string]> = [
  [
    '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
    'archivo-latin-variable.woff2',
  ],
  [
    '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2',
    'source-serif-4-latin-variable.woff2',
  ],
];

for (const [from, to] of files) {
  copyFileSync(resolve(root, 'node_modules', from), resolve(out, to));
  console.log(`public/fonts/${to}`);
}
