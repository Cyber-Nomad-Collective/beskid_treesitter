#!/usr/bin/env node
/**
 * Build test/corpus/*.txt from superrepo examples/*.bd (input only; expected trees via test -u).
 *
 * Usage: node scripts/generate-corpus.mjs [--examples DIR] [--out DIR]
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseArgs(argv) {
  let examples = join(ROOT, '../examples');
  let out = join(ROOT, 'test/corpus');
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--examples' && argv[i + 1]) examples = resolve(argv[++i]);
    else if (argv[i] === '--out' && argv[i + 1]) out = resolve(argv[++i]);
  }
  return { examples, out };
}

/**
 * @param {string} title
 * @param {string} source
 */
function corpusEntry(title, source) {
  return [
    '==================',
    title,
    '==================',
    '',
    source.trimEnd(),
    '',
    '---',
    '',
    '',
  ].join('\n');
}

function main() {
  const { examples, out } = parseArgs(process.argv);
  const files = readdirSync(examples).filter((f) => f.endsWith('.bd')).sort();

  for (const file of files) {
    const path = join(examples, file);
    const source = readFileSync(path, 'utf8');
    const name = basename(file, '.bd');
    const title = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const corpus = corpusEntry(`Example: ${title}`, source);
    const outPath = join(out, `${name}.txt`);
    writeFileSync(outPath, corpus, 'utf8');
    console.log(`Wrote ${outPath}`);
  }
}

main();
