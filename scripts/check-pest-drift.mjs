#!/usr/bin/env node
/**
 * Compare rule names in beskid.pest vs grammar.js (informational).
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePestFile } from './lib/parse-pest.mjs';
import { SKIP_RULES, RENAME_RULES } from './treesitter-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const pestPath = process.argv[2] ?? join(ROOT, '../compiler/crates/beskid_analysis/src/beskid.pest');
const grammarPath = process.argv[3] ?? join(ROOT, 'grammar.js');

const pest = parsePestFile(pestPath, readFileSync(pestPath, 'utf8'));
const grammarSrc = readFileSync(grammarPath, 'utf8');
const grammarRules = new Set([...grammarSrc.matchAll(/^\s{4}([a-z_][a-z0-9_]*):/gm)].map((m) => m[1]));

const expectedTs = new Set();
for (const name of pest.rules.keys()) {
  if (SKIP_RULES.has(name)) continue;
  const renamed = RENAME_RULES[name] ?? name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
  expectedTs.add(renamed);
}

const missing = [...expectedTs].filter((r) => !grammarRules.has(r)).sort();
const extra = [...grammarRules].filter((r) => !expectedTs.has(r) && !r.startsWith('_')).sort();

console.log(`Pest rules (mapped): ${expectedTs.size}`);
console.log(`Grammar rules: ${grammarRules.size}`);
if (missing.length) {
  console.log('\nIn pest but not in grammar.js (may be manual/inline):');
  for (const r of missing) console.log(`  - ${r}`);
}
if (extra.length) {
  console.log('\nIn grammar.js but not mapped from pest:');
  for (const r of extra) console.log(`  - ${r}`);
}
if (!missing.length && !extra.length) console.log('\nRule sets align.');
